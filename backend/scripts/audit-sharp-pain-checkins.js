// Read-only audit: did any check-in ever report sharp pain at moderate or severe
// severity, and if so, did the recommendation it received violate the rule that
// was fixed on 2026-07-15 (excluding intensity=high or difficulty>=4 videos)?
//
// Makes no writes. Safe to run against production.
//
// Usage (from the backend/ directory, wherever DATABASE_PATH points at the real DB):
//   node scripts/audit-sharp-pain-checkins.js
//
// On Railway specifically, run it in the same environment as the app so
// DATABASE_PATH resolves correctly, e.g.:
//   railway run node scripts/audit-sharp-pain-checkins.js
// or open a shell on the service (railway shell) and run it from there.

const db = require('../db/database');
const { getVideoById } = require('../services/videoLibrary');

function parseFlags(raw) {
  if (!raw) return [];
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
}

function main() {
  const checkins = db.prepare(`
    SELECT checkin_id, user_id, timestamp, body_map_flags
    FROM daily_checkins
    ORDER BY timestamp ASC
  `).all();

  console.log(`Scanned ${checkins.length} check-in(s) total.\n`);

  const matches = [];
  for (const c of checkins) {
    const flags = parseFlags(c.body_map_flags);
    const sharpModSevere = flags.filter(
      (f) => f.pain_type === 'Sharp' && (f.severity === 'moderate' || f.severity === 'severe')
    );
    if (sharpModSevere.length > 0) {
      matches.push({ checkin: c, flags: sharpModSevere });
    }
  }

  if (matches.length === 0) {
    console.log('No check-ins found with Sharp pain at moderate or severe severity.');
    console.log('The missing rule (fixed 2026-07-15) never had a matching case to affect.');
    return;
  }

  console.log(`Found ${matches.length} check-in(s) with Sharp pain at moderate/severe severity:\n`);

  for (const { checkin, flags } of matches) {
    console.log(`Check-in ${checkin.checkin_id} | user ${checkin.user_id} | ${checkin.timestamp}`);
    console.log(`  Flags: ${flags.map((f) => `${f.region} (${f.severity})`).join(', ')}`);

    const rec = db.prepare(`
      SELECT rec_id, primary_workout, primary_session_type
      FROM recommendations
      WHERE checkin_id = ?
    `).get(checkin.checkin_id);

    if (!rec) {
      console.log('  No recommendation on record for this check-in.\n');
      continue;
    }

    let primary;
    try {
      primary = JSON.parse(rec.primary_workout);
    } catch {
      console.log('  Could not parse stored recommendation.\n');
      continue;
    }

    const video = getVideoById(primary.id);
    if (!video) {
      console.log(`  Recommended video ${primary.id} not found in current library (may have been removed/renamed).\n`);
      continue;
    }

    const wouldBeExcludedNow = video.intensity === 'high' || video.difficulty >= 4;
    console.log(`  Recommended: "${video.title}" | intensity=${video.intensity} | difficulty=${video.difficulty}`);
    console.log(
      wouldBeExcludedNow
        ? '  >>> This recommendation WOULD be excluded under the fixed rule. Real impact.'
        : '  This recommendation would still pass under the fixed rule. No impact from the gap in this case.'
    );
    console.log('');
  }
}

main();
