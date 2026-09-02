-- Stage C (refinement, zero cost) and Stage D (the paid tier, shipped OFF).
-- See docs/AI_ENGINE.md sections 4, 7, 8, 11, 12 and 14.
--
-- ADDITIVE ONLY. Every statement is either CREATE TABLE IF NOT EXISTS or an
-- ALTER TABLE ADD COLUMN with a safe default. No existing row's content is
-- rewritten by this file, and no column is dropped or renamed.
--
-- NOTHING HERE TURNS ANYTHING ON. Auto publish still defaults to 0, the
-- provider mode still defaults to 'mock', the recommendation mode still
-- defaults to 'heuristic', and the topic allow list ships empty, which by
-- itself blocks every auto publish attempt.

-- ─────────────────────────────────────────────────────────────────────
-- C3. Human fact verification.
--
-- docs/AI_ENGINE.md section 3.4, "free fallback for verification": in zero
-- cost mode the freshness/fact gate is satisfied by a person opening the
-- source link and confirming, not by a paid search. These two columns are
-- what records that a person did it, and who.
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE ai_opportunities ADD COLUMN verified_by TEXT NOT NULL DEFAULT '';
ALTER TABLE ai_opportunities ADD COLUMN verified_at TEXT;

-- ─────────────────────────────────────────────────────────────────────
-- D4, layer 7. The auto publish topic allow list.
--
-- An empty table means "no topic is allowed", so auto publish cannot
-- publish anything until a person deliberately adds an entry. The safe
-- state is also the default state, which is the only ordering that is
-- actually safe.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_topic_allowlist (
  id          TEXT PRIMARY KEY,
  -- a plain lowercase keyword or phrase; an opportunity qualifies when its
  -- headline, summary or service slug contains one of these
  topic       TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  created_by  TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_allowlist_topic ON ai_topic_allowlist(topic);

-- ─────────────────────────────────────────────────────────────────────
-- D4, layer 11. The auto publish audit trail.
--
-- Deliberately its own table rather than a flag on `articles`: the CMS
-- articles table stays exactly as the manual editor left it, and every
-- article that reached the public site without a human clicking publish is
-- listed here, permanently, with who armed it and when. The kill switch
-- reads this table to find what to unpublish; the notification email's
-- one click unpublish link carries `unpublish_token`.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_auto_publications (
  id                TEXT PRIMARY KEY,
  article_id        TEXT NOT NULL,
  generation_id     TEXT NOT NULL,
  article_title     TEXT NOT NULL DEFAULT '',
  article_slug      TEXT NOT NULL DEFAULT '',
  published_at      TEXT NOT NULL,
  -- who armed auto publish at the time this article went out. There is no
  -- "the system armed itself" value: arming is only reachable from an
  -- authenticated admin write.
  armed_by          TEXT NOT NULL DEFAULT '',
  -- single use capability for the one click unpublish link in the email
  unpublish_token   TEXT NOT NULL,
  unpublished_at    TEXT,
  unpublished_by    TEXT NOT NULL DEFAULT '',
  notified          INTEGER NOT NULL DEFAULT 0,
  notify_error      TEXT NOT NULL DEFAULT '',
  created_at        TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_autopub_token ON ai_auto_publications(unpublish_token);
CREATE INDEX IF NOT EXISTS idx_ai_autopub_published ON ai_auto_publications(published_at);

-- ─────────────────────────────────────────────────────────────────────
-- D2 / D4. Settings columns the writer needs.
--
-- auto_publish_enabled, auto_publish_expires_at, auto_publish_weekly_cap,
-- auto_publish_week_start and auto_publish_count_this_week already exist
-- (migration 0004). These add the audit fields and the notification
-- address that Stage D needs.
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE ai_settings ADD COLUMN auto_publish_armed_by TEXT NOT NULL DEFAULT '';
ALTER TABLE ai_settings ADD COLUMN auto_publish_armed_at TEXT;
-- Where the "an article was auto published" email goes. Empty means the
-- built in default address in src/lib/ai/notify.ts is used.
ALTER TABLE ai_settings ADD COLUMN auto_publish_notify_email TEXT NOT NULL DEFAULT '';
-- Records that the kill switch ran, so the admin screen can say so plainly.
ALTER TABLE ai_settings ADD COLUMN auto_publish_killed_at TEXT;
ALTER TABLE ai_settings ADD COLUMN auto_publish_killed_by TEXT NOT NULL DEFAULT '';
