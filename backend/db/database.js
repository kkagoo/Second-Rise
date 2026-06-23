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

module.exports = db;
