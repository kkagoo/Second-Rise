const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// DATABASE_PATH env var lets Railway (or any host) point to a persistent volume
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'second-rise.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

// Migrations
try { db.exec("ALTER TABLE user_profiles ADD COLUMN oura_access_token TEXT"); }    catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN oura_refresh_token TEXT"); }   catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN oura_token_expires_at TEXT"); } catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN whoop_access_token TEXT"); }    catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN whoop_refresh_token TEXT"); }   catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN whoop_token_expires_at TEXT"); } catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN google_fit_access_token TEXT"); } catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN google_fit_refresh_token TEXT"); } catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN google_fit_token_expires_at TEXT"); } catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN fitbit_access_token TEXT"); }    catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN fitbit_refresh_token TEXT"); }   catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN fitbit_token_expires_at TEXT"); } catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN fitbit_user_id TEXT"); }          catch (_) {}
try { db.exec("ALTER TABLE daily_checkins ADD COLUMN workout_preference TEXT"); }   catch (_) {}
try { db.exec("ALTER TABLE daily_checkins ADD COLUMN checkin_date TEXT"); }         catch (_) {}
try { db.exec("ALTER TABLE resources ADD COLUMN thumbnail_url TEXT"); }             catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN withings_access_token TEXT"); }   catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN withings_refresh_token TEXT"); }  catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN withings_token_expires_at TEXT"); } catch (_) {}

// Withings daily data table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS withings_daily_data (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date            TEXT NOT NULL,
      resting_hr      INTEGER,
      total_sleep_min INTEGER,
      rem_sleep_min   INTEGER,
      deep_sleep_min  INTEGER,
      light_sleep_min INTEGER,
      synced_at       TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, date)
    )
  `);
} catch (_) {}
try { db.exec("ALTER TABLE daily_checkins ADD COLUMN sleep_quality INTEGER"); }      catch (_) {}
try { db.exec("ALTER TABLE daily_checkins ADD COLUMN menstruating TEXT"); }          catch (_) {}
try { db.exec("ALTER TABLE recommendations ADD COLUMN body_focus TEXT"); }          catch (_) {}
try { db.exec("ALTER TABLE daily_wearable_reviews ADD COLUMN cardio_load REAL"); }  catch (_) {}

// Resources table for Wellness Resources Hub
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'article',
      author      TEXT,
      url         TEXT NOT NULL,
      description TEXT,
      tags        TEXT DEFAULT '[]',
      featured    INTEGER NOT NULL DEFAULT 0,
      active      INTEGER NOT NULL DEFAULT 1,
      date_added  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
} catch (_) {}

// Activity log table (manual + video-sourced activities)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_date TEXT NOT NULL,
      logged_at     TEXT NOT NULL DEFAULT (datetime('now')),
      category      TEXT NOT NULL,
      activity      TEXT NOT NULL,
      duration_min  INTEGER,
      intensity     TEXT DEFAULT 'moderate',
      notes         TEXT,
      source        TEXT DEFAULT 'manual',
      video_id      INTEGER
    )
  `);
} catch (_) {}

// Resource bookmarks
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS resource_bookmarks (
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      saved_at    TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, resource_id)
    )
  `);
} catch (_) {}

// Garmin OAuth 1.0a tokens
try { db.exec("ALTER TABLE user_profiles ADD COLUMN garmin_oauth_token TEXT"); }        catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN garmin_oauth_token_secret TEXT"); } catch (_) {}

// Garmin daily health data (pushed via Garmin Health API webhook)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS garmin_daily_data (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date                  TEXT NOT NULL,
      steps                 INTEGER,
      resting_hr            INTEGER,
      avg_hr                INTEGER,
      total_sleep_sec       INTEGER,
      deep_sleep_sec        INTEGER,
      light_sleep_sec       INTEGER,
      rem_sleep_sec         INTEGER,
      awake_sec             INTEGER,
      sleep_score           INTEGER,
      avg_stress            INTEGER,
      spo2_avg              REAL,
      avg_respiration       REAL,
      body_battery_charged  INTEGER,
      active_kcal           INTEGER,
      synced_at             TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, date)
    )
  `);
} catch (_) {}

// Self-reported recovery fields on post-session feedback (no wearable fallback)
try { db.exec("ALTER TABLE post_session_feedback ADD COLUMN energy_level TEXT"); }   catch (_) {}
try { db.exec("ALTER TABLE post_session_feedback ADD COLUMN soreness_level TEXT"); } catch (_) {}

// Password reset tokens
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0
    )
  `);
} catch (_) {}

// Health Connect daily data (Android native reads)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS health_connect_daily_data (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date            TEXT NOT NULL,
      resting_hr      INTEGER,
      hrv_rmssd       INTEGER,
      spo2            INTEGER,
      steps           INTEGER,
      total_sleep_min INTEGER,
      deep_sleep_min  INTEGER,
      rem_sleep_min   INTEGER,
      light_sleep_min INTEGER,
      sleep_score     INTEGER,
      synced_at       TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, date)
    )
  `);
} catch (_) {}

// 14-day historical trend data from Google Health / Google Fit
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS google_health_trends (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date            TEXT NOT NULL,
      resting_hr      INTEGER,
      total_sleep_min INTEGER,
      deep_sleep_min  INTEGER,
      rem_sleep_min   INTEGER,
      step_count      INTEGER,
      synced_at       TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, date)
    )
  `);
} catch (_) {}

// Opt-in consent flags on user_profiles
try { db.exec("ALTER TABLE user_profiles ADD COLUMN cycle_tracking_consent INTEGER NOT NULL DEFAULT 0"); } catch (_) {}

// Streak tracking on user_profiles
try { db.exec("ALTER TABLE user_profiles ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0"); }  catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN longest_streak INTEGER NOT NULL DEFAULT 0"); }  catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN last_streak_date TEXT"); }                      catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN streak_milestones INTEGER NOT NULL DEFAULT 0"); } catch (_) {} // count of 7-day milestones hit (each = $1 pledge to Girls Who Code)

// Admin flag
try { db.exec("ALTER TABLE user_profiles ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"); } catch (_) {}

// Waitlist — pre-launch lead capture
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT,
      email      TEXT NOT NULL UNIQUE,
      challenge  TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
} catch (_) {}

// Goal tracking on user_profiles
try { db.exec("ALTER TABLE user_profiles ADD COLUMN goal TEXT"); }              catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN goal_details TEXT"); }      catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN goal_set_at TEXT"); }       catch (_) {}
try { db.exec("ALTER TABLE user_profiles ADD COLUMN goal_target_date TEXT"); }  catch (_) {}

// Seed admin from environment variable — set ADMIN_EMAIL in Railway to promote an account on boot.
// Safe to run on every startup (no-op if user doesn't exist or is already admin).
const adminEmail = process.env.ADMIN_EMAIL;
if (adminEmail) {
  try {
    db.prepare(`
      UPDATE user_profiles SET is_admin = 1
      WHERE user_id = (SELECT id FROM users WHERE email = ? LIMIT 1)
    `).run(adminEmail);
  } catch (_) {}
}

module.exports = db;
