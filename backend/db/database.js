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
try { db.exec("ALTER TABLE daily_checkins ADD COLUMN workout_preference TEXT"); }   catch (_) {}
try { db.exec("ALTER TABLE recommendations ADD COLUMN body_focus TEXT"); }          catch (_) {}

module.exports = db;
