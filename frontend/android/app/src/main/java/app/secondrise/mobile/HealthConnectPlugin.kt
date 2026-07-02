package app.secondrise.mobile

import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

@CapacitorPlugin(name = "HealthConnect")
class HealthConnectPlugin : Plugin() {

    companion object {
        val PERMISSIONS = setOf(
            HealthPermission.getReadPermission(SleepSessionRecord::class),
            HealthPermission.getReadPermission(HeartRateRecord::class),
            HealthPermission.getReadPermission(RestingHeartRateRecord::class),
            HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
            HealthPermission.getReadPermission(OxygenSaturationRecord::class),
            HealthPermission.getReadPermission(StepsRecord::class),
        )
    }

    // Registered in load() so it's ready before the activity starts — avoids crash
    private lateinit var permissionLauncher: ActivityResultLauncher<Set<String>>
    private var pendingPermissionCall: PluginCall? = null

    override fun load() {
        permissionLauncher = activity.registerForActivityResult(
            PermissionController.createRequestPermissionResultContract()
        ) { _ ->
            // Result set is unreliable — check actual granted state instead
            val call = pendingPermissionCall ?: return@registerForActivityResult
            pendingPermissionCall = null
            val client = try { HealthConnectClient.getOrCreate(context) } catch (e: Exception) {
                val ret = JSObject(); ret.put("granted", false); call.resolve(ret); return@registerForActivityResult
            }
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val granted = client.permissionController.getGrantedPermissions()
                    val ret = JSObject()
                    ret.put("granted", granted.containsAll(PERMISSIONS))
                    call.resolve(ret)
                } catch (e: Exception) {
                    val ret = JSObject(); ret.put("granted", false); call.resolve(ret)
                }
            }
        }
    }

    @PluginMethod
    fun checkAvailability(call: PluginCall) {
        try {
            val status = HealthConnectClient.getSdkStatus(context)
            val ret = JSObject()
            ret.put("status", when (status) {
                HealthConnectClient.SDK_AVAILABLE -> "available"
                HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update_required"
                else -> "unavailable"
            })
            call.resolve(ret)
        } catch (e: Exception) {
            val ret = JSObject(); ret.put("status", "unavailable"); call.resolve(ret)
        }
    }

    @PluginMethod
    fun requestHCPermissions(call: PluginCall) {
        try {
            if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
                call.reject("Health Connect not available on this device"); return
            }
            pendingPermissionCall = call
            permissionLauncher.launch(PERMISSIONS)
        } catch (e: Exception) {
            pendingPermissionCall = null
            call.reject("Failed to open Health Connect permissions: ${e.message}")
        }
    }

    @PluginMethod
    fun syncToday(call: PluginCall) {
        if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect not available"); return
        }
        val client = try {
            HealthConnectClient.getOrCreate(context)
        } catch (e: Exception) {
            call.reject("Health Connect unavailable: ${e.message}"); return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.containsAll(PERMISSIONS)) {
                    call.reject("permissions_not_granted"); return@launch
                }

                val zone = ZoneId.systemDefault()
                val today = LocalDate.now(zone)
                val startOfDay: Instant = today.atStartOfDay(zone).toInstant()
                val startOfYesterday: Instant = today.minusDays(1).atStartOfDay(zone).toInstant()
                val now: Instant = Instant.now()

                // Each metric read is isolated — one failure doesn't break the rest
                val restingHr: Int? = try {
                    client.readRecords(ReadRecordsRequest(RestingHeartRateRecord::class, TimeRangeFilter.between(startOfDay, now)))
                        .records.lastOrNull()?.beatsPerMinute?.toInt()
                } catch (e: Exception) { null }

                val hrvRmssd: Int? = try {
                    val recs = client.readRecords(ReadRecordsRequest(HeartRateVariabilityRmssdRecord::class, TimeRangeFilter.between(startOfDay, now))).records
                    if (recs.isNotEmpty()) recs.map { it.heartRateVariabilityMillis }.average().toInt() else null
                } catch (e: Exception) { null }

                val spo2: Int? = try {
                    val recs = client.readRecords(ReadRecordsRequest(OxygenSaturationRecord::class, TimeRangeFilter.between(startOfDay, now))).records
                    if (recs.isNotEmpty()) recs.map { it.percentage.value }.average().let { Math.round(it).toInt() } else null
                } catch (e: Exception) { null }

                val steps: Int? = try {
                    val recs = client.readRecords(ReadRecordsRequest(StepsRecord::class, TimeRangeFilter.between(startOfDay, now))).records
                    if (recs.isNotEmpty()) recs.sumOf { it.count }.toInt() else null
                } catch (e: Exception) { null }

                var totalSleepMin: Int? = null
                var deepSleepMin: Int? = null
                var remSleepMin: Int? = null
                var lightSleepMin: Int? = null
                var sleepScore: Int? = null

                try {
                    val sessions = client.readRecords(ReadRecordsRequest(SleepSessionRecord::class, TimeRangeFilter.between(startOfYesterday, now))).records
                    val session = sessions.filter { it.endTime >= startOfDay || it.startTime >= startOfYesterday }.maxByOrNull { it.endTime }
                    if (session != null) {
                        totalSleepMin = ((session.endTime.epochSecond - session.startTime.epochSecond) / 60).toInt()
                        var deep = 0L; var rem = 0L; var light = 0L
                        for (stage in session.stages) {
                            val mins = (stage.endTime.epochSecond - stage.startTime.epochSecond) / 60
                            when (stage.stage) {
                                SleepSessionRecord.STAGE_TYPE_DEEP  -> deep += mins
                                SleepSessionRecord.STAGE_TYPE_REM   -> rem += mins
                                SleepSessionRecord.STAGE_TYPE_LIGHT -> light += mins
                                else -> {}
                            }
                        }
                        deepSleepMin  = if (deep > 0) deep.toInt() else null
                        remSleepMin   = if (rem > 0) rem.toInt() else null
                        lightSleepMin = if (light > 0) light.toInt() else null
                        totalSleepMin?.let { t ->
                            var score = 50
                            score += when { t >= 480 -> 20; t >= 420 -> 15; t >= 360 -> 5; else -> -15 }
                            deepSleepMin?.let { d -> score += when { d >= 90 -> 15; d >= 60 -> 10; d >= 30 -> 5; else -> 0 } }
                            remSleepMin?.let { r -> score += when { r >= 90 -> 15; r >= 60 -> 10; r >= 30 -> 5; else -> 0 } }
                            sleepScore = score.coerceIn(0, 100)
                        }
                    }
                } catch (e: Exception) { /* sleep unavailable — continue */ }

                val result = JSObject()
                result.put("resting_hr", restingHr)
                result.put("hrv_rmssd", hrvRmssd)
                result.put("spo2", spo2)
                result.put("steps", steps)
                result.put("total_sleep_min", totalSleepMin)
                result.put("deep_sleep_min", deepSleepMin)
                result.put("rem_sleep_min", remSleepMin)
                result.put("light_sleep_min", lightSleepMin)
                result.put("sleep_score", sleepScore)
                call.resolve(result)

            } catch (e: Exception) {
                call.reject("Sync failed: ${e.message}")
            }
        }
    }
}
