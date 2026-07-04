import Foundation
import Capacitor
import HealthKit

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin {

    private let healthStore = HKHealthStore()

    // All quantity types we want to read
    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        let identifiers: [HKQuantityTypeIdentifier] = [
            .restingHeartRate,
            .heartRateVariabilitySDNN,
            .oxygenSaturation,
            .stepCount,
        ]
        for id in identifiers {
            if let t = HKQuantityType.quantityType(forIdentifier: id) {
                types.insert(t)
            }
        }
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            types.insert(sleepType)
        }
        return types
    }

    // MARK: - checkAvailability

    @objc public func checkAvailability(_ call: CAPPluginCall) {
        let available = HKHealthStore.isHealthDataAvailable()
        call.resolve(["available": available])
    }

    // MARK: - requestHKPermissions

    @objc public func requestHKPermissions(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit not available")
            return
        }
        bridge?.saveCall(call)
        let callbackId = call.callbackId
        healthStore.requestAuthorization(toShare: Set<HKSampleType>(), read: readTypes) { success, error in
            DispatchQueue.main.async {
                guard let savedCall = self.bridge?.savedCall(withID: callbackId) else { return }
                self.bridge?.releaseCall(savedCall)
                if let error = error {
                    savedCall.reject("HealthKit authorization failed: \(error.localizedDescription)")
                } else {
                    savedCall.resolve(["granted": success])
                }
            }
        }
    }

    // MARK: - syncToday

    @objc public func syncToday(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit not available")
            return
        }
        bridge?.saveCall(call)
        let syncCallbackId = call.callbackId

        let calendar = Calendar.current
        let now = Date()
        guard let startOfDay = calendar.dateInterval(of: .day, for: now)?.start else {
            call.reject("Could not determine start of day")
            return
        }
        // Look back from yesterday midnight to catch overnight sleep
        let startOfYesterday = calendar.date(byAdding: .day, value: -1, to: startOfDay) ?? startOfDay

        let group = DispatchGroup()
        var restingHR: Int?
        var hrvSDNN: Int?
        var spo2: Int?
        var steps: Int?
        var totalSleepMin: Int?
        var deepSleepMin: Int?
        var remSleepMin: Int?
        var lightSleepMin: Int?
        var sleepScore: Int?

        // ── Resting Heart Rate ──────────────────────────────────────────────
        // Look back to yesterday: Apple Watch computes resting HR overnight, so the
        // most recent sample may be timestamped from last night rather than today.
        group.enter()
        if let type = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) {
            let pred = HKQuery.predicateForSamples(withStart: startOfYesterday, end: now)
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
            let query = HKSampleQuery(sampleType: type, predicate: pred, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
                if let sample = samples?.first as? HKQuantitySample {
                    restingHR = Int(sample.quantity.doubleValue(for: .init(from: "count/min")))
                }
                group.leave()
            }
            healthStore.execute(query)
        } else { group.leave() }

        // ── HRV (SDNN) ─────────────────────────────────────────────────────
        // Look back to yesterday: HRV is measured during sleep, so samples may be
        // from overnight rather than today's window.
        group.enter()
        if let type = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) {
            let pred = HKQuery.predicateForSamples(withStart: startOfYesterday, end: now)
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
            let query = HKSampleQuery(sampleType: type, predicate: pred, limit: 10, sortDescriptors: [sort]) { _, samples, _ in
                if let s = samples as? [HKQuantitySample], !s.isEmpty {
                    let avg = s.map { $0.quantity.doubleValue(for: .secondUnit(with: .milli)) }.reduce(0, +) / Double(s.count)
                    hrvSDNN = Int(avg)
                }
                group.leave()
            }
            healthStore.execute(query)
        } else { group.leave() }

        // ── SpO2 ───────────────────────────────────────────────────────────
        group.enter()
        if let type = HKQuantityType.quantityType(forIdentifier: .oxygenSaturation) {
            let pred = HKQuery.predicateForSamples(withStart: startOfDay, end: now)
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
            let query = HKSampleQuery(sampleType: type, predicate: pred, limit: 10, sortDescriptors: [sort]) { _, samples, _ in
                if let s = samples as? [HKQuantitySample], !s.isEmpty {
                    let avg = s.map { $0.quantity.doubleValue(for: .percent()) }.reduce(0, +) / Double(s.count)
                    spo2 = Int(avg * 100) // HealthKit stores as 0.0–1.0
                }
                group.leave()
            }
            healthStore.execute(query)
        } else { group.leave() }

        // ── Steps ──────────────────────────────────────────────────────────
        group.enter()
        if let type = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            let pred = HKQuery.predicateForSamples(withStart: startOfDay, end: now)
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, _ in
                steps = stats?.sumQuantity().map { Int($0.doubleValue(for: .count())) }
                group.leave()
            }
            healthStore.execute(query)
        } else { group.leave() }

        // ── Sleep ──────────────────────────────────────────────────────────
        group.enter()
        if let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            let pred = HKQuery.predicateForSamples(withStart: startOfYesterday, end: now)
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
            let query = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                guard let sleepSamples = samples as? [HKCategorySample] else { group.leave(); return }

                // Filter to samples that ended after midnight today (main sleep session)
                let relevant = sleepSamples.filter { $0.endDate >= startOfDay }
                guard !relevant.isEmpty else { group.leave(); return }

                var totalSec = 0
                var deepSec = 0
                var remSec = 0
                var lightSec = 0

                for sample in relevant {
                    let dur = Int(sample.endDate.timeIntervalSince(sample.startDate))
                    switch HKCategoryValueSleepAnalysis(rawValue: sample.value) {
                    case .asleepDeep:   deepSec  += dur; totalSec += dur
                    case .asleepREM:    remSec   += dur; totalSec += dur
                    case .asleepCore,
                         .asleepUnspecified:
                                        lightSec += dur; totalSec += dur
                    case .inBed, .awake: break
                    default:            break
                    }
                }

                totalSleepMin = totalSec > 0 ? totalSec / 60 : nil
                deepSleepMin  = deepSec  > 0 ? deepSec  / 60 : nil
                remSleepMin   = remSec   > 0 ? remSec   / 60 : nil
                lightSleepMin = lightSec > 0 ? lightSec / 60 : nil

                // Derive sleep score (0-100) from duration + stage quality
                if let total = totalSleepMin, total > 0 {
                    var score = 50
                    score += total >= 480 ? 20 : total >= 420 ? 15 : total >= 360 ? 5 : -15
                    if let deep = deepSleepMin {
                        score += deep >= 90 ? 15 : deep >= 60 ? 10 : deep >= 30 ? 5 : 0
                    }
                    if let rem = remSleepMin {
                        score += rem >= 90 ? 15 : rem >= 60 ? 10 : rem >= 30 ? 5 : 0
                    }
                    sleepScore = min(max(score, 0), 100)
                }

                group.leave()
            }
            healthStore.execute(query)
        } else { group.leave() }

        // ── Collect results ────────────────────────────────────────────────
        group.notify(queue: .main) {
            guard let savedCall = self.bridge?.savedCall(withID: syncCallbackId) else { return }
            self.bridge?.releaseCall(savedCall)
            var result = JSObject()
            if let v = restingHR    { result["resting_hr"]      = v }
            if let v = hrvSDNN      { result["hrv_rmssd"]       = v }
            if let v = spo2         { result["spo2"]            = v }
            if let v = steps        { result["steps"]           = v }
            if let v = totalSleepMin { result["total_sleep_min"] = v }
            if let v = deepSleepMin  { result["deep_sleep_min"]  = v }
            if let v = remSleepMin   { result["rem_sleep_min"]   = v }
            if let v = lightSleepMin { result["light_sleep_min"] = v }
            if let v = sleepScore    { result["sleep_score"]     = v }
            result["hrv_type"] = "sdnn"
            savedCall.resolve(result)
        }
    }
}
