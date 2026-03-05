const AdmZip = require('adm-zip');
const sax    = require('sax');
const db     = require('../db/database');

const THIRTY_DAYS_AGO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

const HRV_TYPE   = 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN';
const RHR_TYPE   = 'HKQuantityTypeIdentifierRestingHeartRate';
const SLEEP_TYPE = 'HKCategoryTypeIdentifierSleepAnalysis';
const STEP_TYPE  = 'HKQuantityTypeIdentifierStepCount';

// Sleep value that indicates "asleep" (value=0 = InBed, value=1 = Asleep)
const SLEEP_ASLEEP_VALUES = new Set(['HKCategoryValueSleepAnalysisAsleep', '1']);

async function parseAndStore(userId, zipBuffer) {
  const zip = new AdmZip(zipBuffer);

  // Find export.xml — may be at top level or inside apple_health_export/
  const entry = zip.getEntries().find((e) =>
    e.entryName === 'apple_health_export/export.xml' ||
    e.entryName === 'export.xml'
  );

  if (!entry) {
    throw new Error('Could not find export.xml inside the zip. Please re-export from the Health app.');
  }

  const xmlData = entry.getData();
  const cutoff  = THIRTY_DAYS_AGO();

  // Accumulate daily buckets
  const hrv   = {};   // date → [values]
  const rhr   = {};   // date → [values]
  const sleep = {};   // date → totalMinutes
  const steps = {};   // date → totalSteps

  await new Promise((resolve, reject) => {
    const parser = sax.createStream(true, { lowercase: false });

    parser.on('opentag', (node) => {
      if (node.name !== 'Record') return;
      const { type, startDate, endDate, value } = node.attributes;
      if (!type || !startDate) return;

      const date = startDate.slice(0, 10);
      if (date < cutoff) return;

      if (type === HRV_TYPE) {
        const v = parseFloat(value);
        if (!isNaN(v)) {
          hrv[date] = hrv[date] || [];
          hrv[date].push(v);
        }
      } else if (type === RHR_TYPE) {
        const v = parseFloat(value);
        if (!isNaN(v)) {
          rhr[date] = rhr[date] || [];
          rhr[date].push(v);
        }
      } else if (type === SLEEP_TYPE) {
        if (!SLEEP_ASLEEP_VALUES.has(value)) return;
        if (!endDate) return;
        const start = new Date(startDate);
        const end   = new Date(endDate);
        const mins  = Math.max(0, (end - start) / 60000);
        sleep[date] = (sleep[date] || 0) + mins;
      } else if (type === STEP_TYPE) {
        const v = parseFloat(value);
        if (!isNaN(v)) {
          steps[date] = (steps[date] || 0) + v;
        }
      }
    });

    parser.on('error', reject);
    parser.on('end', resolve);

    // Write buffer in chunks to avoid blocking
    const CHUNK = 64 * 1024;
    let offset = 0;
    function pump() {
      if (offset >= xmlData.length) { parser.end(); return; }
      parser.write(xmlData.slice(offset, offset + CHUNK).toString('utf8'));
      offset += CHUNK;
      setImmediate(pump);
    }
    pump();
  });

  // Collect all dates
  const allDates = new Set([
    ...Object.keys(hrv),
    ...Object.keys(rhr),
    ...Object.keys(sleep),
    ...Object.keys(steps),
  ]);

  const upsert = db.prepare(`
    INSERT INTO apple_health_data (user_id, date, hrv_ms, resting_hr, sleep_min, step_count, imported_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      hrv_ms     = excluded.hrv_ms,
      resting_hr = excluded.resting_hr,
      sleep_min  = excluded.sleep_min,
      step_count = excluded.step_count,
      imported_at = datetime('now')
  `);

  const insertMany = db.transaction((dates) => {
    for (const date of dates) {
      const hrvArr = hrv[date];
      const rhrArr = rhr[date];
      upsert.run(
        userId,
        date,
        hrvArr ? (hrvArr.reduce((a, b) => a + b, 0) / hrvArr.length) : null,
        rhrArr ? Math.round(rhrArr.reduce((a, b) => a + b, 0) / rhrArr.length) : null,
        sleep[date] ? Math.round(sleep[date]) : null,
        steps[date] ? Math.round(steps[date]) : null,
      );
    }
  });

  insertMany([...allDates]);

  return allDates.size;
}

module.exports = { parseAndStore };
