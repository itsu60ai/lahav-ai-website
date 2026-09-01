-- Website content CMS.
--
-- CODE still controls layout, section structure and styling. These tables
-- hold only the TEXT and MEDIA that the client wants to change without a
-- code deploy: home/about/contact/navigation/footer copy, the five
-- services' text, FAQ, global settings and uploaded images.
--
-- content_pages / services_content share one pattern: a DRAFT copy and a
-- PUBLISHED copy, as separate JSON columns on the same row. The public
-- site reads published_json only. draft_json is what the editor works on
-- and what preview renders. Publishing copies draft -> published. This is
-- the "safe published/draft model" from the brief; full version history
-- is deliberately not built in this phase (see docs/WEBSITE_CMS.md).
--
-- JSON is used here because each page's shape is fixed and known (typed
-- in src/lib/cms/content.ts), not because it holds arbitrary structure.
-- FAQ and media are real rows, per the brief's explicit relational
-- requirement for repeated list content.

CREATE TABLE IF NOT EXISTS content_pages (
  -- one of: home, about, contact, navigation, footer
  id                TEXT PRIMARY KEY,
  draft_json        TEXT NOT NULL,
  -- NULL until the first publish. The public site falls back to the
  -- code-side default (the exact current approved copy) until then, so
  -- nothing goes live by accident and nothing goes blank either.
  published_json    TEXT,
  draft_updated_at  TEXT NOT NULL,
  draft_updated_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  published_at      TEXT,
  published_by      TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS services_content (
  -- the five existing, fixed slugs. Row creation/deletion is not exposed
  -- in the admin; the slug list is the same five defined in src/lib/site.ts.
  slug              TEXT PRIMARY KEY,
  draft_json        TEXT NOT NULL,
  published_json    TEXT,
  draft_updated_at  TEXT NOT NULL,
  draft_updated_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  published_at      TEXT,
  published_by      TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- FAQ: immediate-write, not draft/published. An FAQ item is small and
-- atomic; `enabled` already gives an editor a safe way to stage an item
-- before it appears publicly, which is what draft/publish would add for
-- a whole-page edit. See docs/WEBSITE_CMS.md for the reasoning.
CREATE TABLE IF NOT EXISTS faq_items (
  id          TEXT PRIMARY KEY,
  question    TEXT NOT NULL DEFAULT '',
  answer      TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  enabled     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Global reusable business details. Immediate-write (no draft stage):
-- these are facts (a phone number, a booking link), not marketing copy,
-- and staging a WhatsApp number as a "draft" adds risk without adding
-- safety. Sensitive keys (none live here today) must never be added to
-- this table -- see the ban list in docs/WEBSITE_CMS.md.
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TEXT NOT NULL,
  updated_by  TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Media library. Images are stored as base64 in `data_b64` because this
-- Cloudflare account does not have R2 enabled yet (attempted during this
-- build; R2 requires a one-time dashboard opt-in only the account owner
-- can do). This is why uploads are capped at ~700 KB: see
-- src/lib/cms/media.ts. Moving to R2 later is a one-file change -- this
-- table's shape (id, filename, alt, mime, dimensions) does not change,
-- only where the bytes live.
CREATE TABLE IF NOT EXISTS media (
  id          TEXT PRIMARY KEY,
  filename    TEXT NOT NULL,
  alt         TEXT NOT NULL DEFAULT '',
  mime        TEXT NOT NULL,
  width       INTEGER,
  height      INTEGER,
  size_bytes  INTEGER NOT NULL,
  data_b64    TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Who published what, when. Deliberately minimal -- no secrets, no
-- request bodies, just enough to answer "who changed the homepage and
-- when" (brief section 25).
CREATE TABLE IF NOT EXISTS content_audit_log (
  id          TEXT PRIMARY KEY,
  area        TEXT NOT NULL,
  action      TEXT NOT NULL,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_faq_sort ON faq_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_audit_created ON content_audit_log(created_at);
