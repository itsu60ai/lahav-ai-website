-- AI content engine: Stage A schema. See docs/AI_ENGINE.md.
--
-- Everything here is an INPUT to the existing CMS, never a parallel path.
-- A generated article is created through the same `articles` table via the
-- same ArticleStore the manual editor already uses (src/lib/cms/d1.ts).
-- Nothing in this file can publish anything; ai_settings.auto_publish_enabled
-- defaults to 0 and nothing in the Stage A code can set it to 1 (see
-- src/lib/ai/settings.ts).

CREATE TABLE IF NOT EXISTS ai_opportunities (
  id                 TEXT PRIMARY KEY,
  source_name        TEXT NOT NULL,
  source_url         TEXT NOT NULL,
  published_at       TEXT,
  headline           TEXT NOT NULL,
  summary            TEXT NOT NULL DEFAULT '',
  why_it_matters     TEXT NOT NULL DEFAULT '',
  suggested_angle    TEXT NOT NULL DEFAULT '',
  content_kind       TEXT NOT NULL DEFAULT 'evergreen',
  service_slug       TEXT NOT NULL DEFAULT '',
  -- unverified | verified | partial. A claim is never upgraded to
  -- "verified" automatically; see src/lib/ai/gates.ts.
  verification       TEXT NOT NULL DEFAULT 'unverified',
  verification_note  TEXT NOT NULL DEFAULT '',
  freshness_score    REAL NOT NULL DEFAULT 0,
  priority           TEXT NOT NULL DEFAULT 'low',
  status             TEXT NOT NULL DEFAULT 'new', -- new | generated | dismissed
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_opps_url ON ai_opportunities(source_url);
CREATE INDEX IF NOT EXISTS idx_ai_opps_status ON ai_opportunities(status);

CREATE TABLE IF NOT EXISTS ai_generations (
  id                 TEXT PRIMARY KEY,
  opportunity_id     TEXT REFERENCES ai_opportunities(id) ON DELETE SET NULL,
  article_id         TEXT REFERENCES articles(id) ON DELETE SET NULL,
  brief_json         TEXT NOT NULL,
  provider_mode      TEXT NOT NULL DEFAULT 'mock', -- mock | manual | api
  model              TEXT NOT NULL DEFAULT 'mock',
  prompt_text        TEXT NOT NULL DEFAULT '',
  raw_output_json    TEXT NOT NULL DEFAULT '{}',
  input_tokens       INTEGER NOT NULL DEFAULT 0,
  output_tokens      INTEGER NOT NULL DEFAULT 0,
  cost_usd           REAL NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'pending', -- pending | succeeded | failed
  gate_results_json  TEXT NOT NULL DEFAULT '[]',
  gates_passed       INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_gen_article ON ai_generations(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_gen_created ON ai_generations(created_at);

CREATE TABLE IF NOT EXISTS ai_feedback (
  id             TEXT PRIMARY KEY,
  generation_id  TEXT REFERENCES ai_generations(id) ON DELETE CASCADE,
  article_id     TEXT REFERENCES articles(id) ON DELETE SET NULL,
  kind           TEXT NOT NULL, -- approve | reject | edit
  field          TEXT NOT NULL DEFAULT '',
  before_text    TEXT NOT NULL DEFAULT '',
  after_text     TEXT NOT NULL DEFAULT '',
  note           TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_gen ON ai_feedback(generation_id);

-- The learned rule list. Plain text, deliberately: the admin can open and
-- delete a wrong rule. See docs/AI_ENGINE.md section 10.
CREATE TABLE IF NOT EXISTS ai_rules (
  id            TEXT PRIMARY KEY,
  rule_text     TEXT NOT NULL,
  source_count  INTEGER NOT NULL DEFAULT 1,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- Single row (id is pinned to 1). auto_publish_enabled defaults to 0 and,
-- in Stage A, nothing anywhere can write a 1 into this column: settings.ts
-- exports readers only. See docs/AI_ENGINE.md section 12.
CREATE TABLE IF NOT EXISTS ai_settings (
  id                            INTEGER PRIMARY KEY CHECK (id = 1),
  provider_mode                 TEXT NOT NULL DEFAULT 'mock', -- mock | manual | api
  auto_publish_enabled          INTEGER NOT NULL DEFAULT 0,
  auto_publish_expires_at       TEXT,
  auto_publish_weekly_cap       INTEGER NOT NULL DEFAULT 0,
  auto_publish_week_start       TEXT,
  auto_publish_count_this_week  INTEGER NOT NULL DEFAULT 0,
  updated_at                    TEXT NOT NULL,
  updated_by                    TEXT NOT NULL DEFAULT ''
);
INSERT OR IGNORE INTO ai_settings (id, provider_mode, auto_publish_enabled, updated_at)
VALUES (1, 'mock', 0, datetime('now'));

-- Generated visuals. Stage A stores on-brand placeholder SVGs (real code,
-- not a raster mock) with real alt text, but does not yet insert them into
-- the public article template. See docs/AI_ENGINE.md section 7-8.
CREATE TABLE IF NOT EXISTS ai_assets (
  id             TEXT PRIMARY KEY,
  generation_id  TEXT REFERENCES ai_generations(id) ON DELETE CASCADE,
  article_id     TEXT REFERENCES articles(id) ON DELETE SET NULL,
  kind           TEXT NOT NULL DEFAULT 'hero', -- hero | diagram | inline
  format         TEXT NOT NULL DEFAULT 'svg',
  filename       TEXT NOT NULL,
  alt_text       TEXT NOT NULL DEFAULT '',
  caption        TEXT NOT NULL DEFAULT '',
  width          INTEGER NOT NULL DEFAULT 0,
  height         INTEGER NOT NULL DEFAULT 0,
  svg_markup     TEXT NOT NULL DEFAULT '',
  source         TEXT NOT NULL DEFAULT 'mock', -- mock | generated
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_assets_gen ON ai_assets(generation_id);
