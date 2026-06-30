package app.secondrise.mobile

import android.app.Activity
import android.content.Intent
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
import com.getcapacitor.annotation.ActivityCallback
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

    @PluginMethod
    fun checkAvailability(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        val ret = JSObject()
        ret.put("status", when (status) {
            HealthConnectClient.SDK_AVAILABLE -> "available"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update_required"
            else -> "unavailable"
        })
        call.resolve(ret)
    }

    @PluginMethod
    fun requestHCPermissions(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect not available on this device")
            return
        }
        val intent = PermissionController.createRequestPermissionResultContract()
            .createIntent(context, PERMISSIONS)
        startActivityForResult(call, intent, "permissionResult")
    }

    @ActivityCallback
    private fun permissionResult(call: PluginCall?, result: androidx.activity.result.ActivityResult) {
        if (call == null) return
        val ret = JSObject()
        ret.put("granted", result.resultCode == Activity.RESULT_OK)
        call.resolve(ret)
    }

    @PluginMethod
    fun syncToday(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect not available")
            return
        }
        val client = HealthConnectClient.getOrCreate(context)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.containsAll(PERMISSIONS)) {
                    call.reject("permissions_not_granted")
                    return@launch
                }

                // Today's time range in local timezone
                val zone = ZoneId.systemDefault()
                val today = LocalDate.now(zone)
                val startOfDay: Instant = today.atStartOfDay(zone).toInstant()
                // Yesterday midnight → catches overnight sleep that ended today
                val startOfYesterday: Instant = today.minusDays(1).atStartOfDay(zone).toInstant()
                val now: Instant = Instant.now()

                // --- Resting HR ---
                val restingHrRecords = client.readRecords(
                    ReadRecordsRequest(
                        recordType = RestingHeartRateRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                    )
                ).records
                val restingHr = restingHrRecords.lastOrNull()?.beatsPerMinute?.toInt()

                // --- HRV (RMSSD) ---
                val hrvRecords = client.readRecords(
                    ReadRecordsRequest(
                        recordType = HeartRateVariabilityRmssdRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                    )
                ).records
                val hrvRmssd = if (hrvRecords.isNotEmpty())
                    hrvRecords.map { it.heartRateVariabilityMillis }.average().toInt()
                else null

                // --- SpO2 ---
                val spo2Records = client.readRecords(
                    ReadRecordsRequest(
                        recordType = OxygenSaturationRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                    )
                ).records
                val spo2 = if (spo2Records.isNotEmpty())
                    spo2Records.map { it.percentage.value }.average().let { Math.round(it).toInt() }
                else null

                // --- Steps ---
                val stepsRecords = client.readRecords(
                    ReadRecordsRequest(
                        recordType = StepsRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                    )
                ).records
                val steps = if (stepsRecords.isNotEmpty())
                    stepsRecords.sumOf { it.count }.toInt()
                else null

                // --- Sleep (look back from yesterday to catch overnight sessions) ---
                val sleepSessions = client.readRecords(
                    ReadRecordsRequest(
                        recordType = SleepSessionRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfYesterday, now)
                    )
                ).records

                // Pick the most recent session that ended after midnight today or started last night
                val sleepSession = sleepSessions
                    .filter { it.endTime >= startOfDay || it.startTime >= startOfYesterday }
                    .maxByOrNull { it.endTime }

                var totalSleepMin: Int? = null
                var deepSleepMin: Int? = null
                var remSleepMin: Int? = null
                var lightSleepMin: Int? = null
                var sleepScore: Int? = null

                if (sleepSession != null) {
                    totalSleepMin = ((sleepSession.endTime.epochSecond - sleepSession.startTime.epochSecond) / 60).toInt()

                    var deep = 0L
                    var rem = 0L
                    var light = 0L
                    for (stage in sleepSession.stages) {
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

                    // Derive a basic sleep score from duration + stages (0-100)
                    if (totalSleepMin != null && totalSleepMin > 0) {
                        var score = 50
                        score += when {
                            totalSleepMin >= 480 -> 20   // ≥8h
                            totalSleepMin >= 420 -> 15   // ≥7h
                            totalSleepMin >= 360 -> 5    // ≥6h
                            else -> -15
                        }
                        if (deepSleepMin != null) score += when {
                            deepSleepMin >= 90 -> 15
                            deepSleepMin >= 60 -> 10
                            deepSleepMin >= 30 -> 5
                            else -> 0
                        }
                        if (remSleepMin != null) score += when {
                            remSleepMin >= 90 -> 15
                            remSleepMin >= 60 -> 10
                            remSleepMin >= 30 -> 5
                            else -> 0
                        }
                        sleepScore = score.coerceIn(0, 100)
                    }
                }

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
                call.reject("Health Connect sync failed: ${e.message}")
            }
        }
    }
}
