-- Initial CMS schema for Cloudflare D1.
-- D1 is SQLite-compatible, so this mirrors the previous local schema.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  failed_count  INTEGER NOT NULL DEFAULT 0,
  locked_until  TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  -- the raw token is never stored, only its SHA-256 hash
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id             TEXT PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  kind           TEXT NOT NULL DEFAULT 'guide',
  status         TEXT NOT NULL DEFAULT 'draft',
  title          TEXT NOT NULL DEFAULT '',
  standfirst     TEXT NOT NULL DEFAULT '',
  excerpt        TEXT NOT NULL DEFAULT '',
  reading_time   TEXT NOT NULL DEFAULT '',
  topic          TEXT NOT NULL DEFAULT '',
  featured       INTEGER NOT NULL DEFAULT 0,
  viz            TEXT NOT NULL DEFAULT 'crm',
  viz_caption    TEXT NOT NULL DEFAULT '',
  service_name   TEXT NOT NULL DEFAULT '',
  service_slug   TEXT NOT NULL DEFAULT '',
  body_json      TEXT NOT NULL DEFAULT '[]',
  is_placeholder INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  published_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
