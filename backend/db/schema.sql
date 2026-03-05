PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id               INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age_range             TEXT,
  menopause_stage       TEXT,
  hrt_status            TEXT,
  bone_health           TEXT,
  pelvic_floor_history  INTEGER NOT NULL DEFAULT 0,
  chronic_joints        TEXT,
  activity_baseline     TEXT,
  equipment_available   TEXT,
  preferred_time        TEXT,
  dinner_cooks_interest INTEGER NOT NULL DEFAULT 0,
  onboarding_complete   INTEGER NOT NULL DEFAULT 0,
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_checkins (
  checkin_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp          TEXT NOT NULL DEFAULT (datetime('now')),
  layer1_energy      INTEGER NOT NULL,
  layer1_time_avail  TEXT NOT NULL,
  pain_flagged       INTEGER NOT NULL DEFAULT 0,
  body_map_flags     TEXT,
  secondary_flags    TEXT,
  computed_readiness INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendations (
  rec_id                INTEGER PRIMARY KEY AUTOINCREMENT,
  checkin_id            INTEGER NOT NULL REFERENCES daily_checkins(checkin_id),
  user_id               INTEGER NOT NULL REFERENCES users(id),
  timestamp             TEXT NOT NULL DEFAULT (datetime('now')),
  primary_session_type  TEXT NOT NULL,
  primary_reasoning     TEXT NOT NULL,
  primary_workout       TEXT NOT NULL,
  alt_1_type            TEXT,
  alt_1_reasoning       TEXT,
  alt_2_type            TEXT,
  alt_2_reasoning       TEXT,
  alt_3_type            TEXT,
  alt_3_reasoning       TEXT,
  selected_session_type TEXT
);

CREATE TABLE IF NOT EXISTS post_session_feedback (
  feedback_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  rec_id           INTEGER NOT NULL REFERENCES recommendations(rec_id),
  user_id          INTEGER NOT NULL REFERENCES users(id),
  timestamp        TEXT NOT NULL DEFAULT (datetime('now')),
  effort_rating    TEXT NOT NULL,
  flare_up_regions TEXT,
  notes            TEXT
);

CREATE TABLE IF NOT EXISTS weekly_reflections (
  reflection_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id),
  week_of            TEXT NOT NULL,
  timestamp          TEXT NOT NULL DEFAULT (datetime('now')),
  sessions_completed INTEGER,
  energy_trend       TEXT,
  free_text_feedback TEXT,
  UNIQUE(user_id, week_of)
);

CREATE INDEX IF NOT EXISTS idx_checkins_user ON daily_checkins(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_recs_checkin  ON recommendations(checkin_id);

CREATE TABLE IF NOT EXISTS oura_daily_data (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                  TEXT NOT NULL,
  readiness_score       INTEGER,
  hrv_balance_score     INTEGER,
  resting_hr            INTEGER,
  body_temp_deviation   REAL,
  sleep_score           INTEGER,
  total_sleep_min       INTEGER,
  rem_sleep_min         INTEGER,
  deep_sleep_min        INTEGER,
  sleep_efficiency      REAL,
  activity_score        INTEGER,
  steps                 INTEGER,
  synced_at             TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS apple_health_data (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            TEXT NOT NULL,
  hrv_ms          REAL,
  resting_hr      INTEGER,
  sleep_min       INTEGER,
  step_count      INTEGER,
  imported_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, date)
);
