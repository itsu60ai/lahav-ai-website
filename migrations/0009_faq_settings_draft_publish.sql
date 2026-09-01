-- CMS finalization, 2026-09-01 (SOURCE_OF_TRUTH.md F-34..F-37).
--
-- FAQ and Settings were "immediate-write" in 0007: every admin action
-- took effect on the public site right away. That was a considered
-- decision at the time (see 0007's own comments), but a second look
-- against the original brief found it wrong for anything a VISITOR sees:
-- public content must never change production the moment someone clicks
-- Save. Both tables get the same draft/published split content_pages and
-- services_content already use.
--
-- This migration is additive and backfills so NOTHING changes for a
-- visitor the moment it runs: whatever is live right now becomes the
-- "already published" state.

-- ─────────────────────────────────────────────────────────────── FAQ
--
-- Existing columns become the DRAFT working copy (renamed with a draft_
-- prefix for symmetry with the new published_* columns). A question is
-- soft-deleted via draft_deleted while it is still live (so preview can
-- hide it while the public page keeps showing it until Publish); an item
-- that was never published is hard-deleted immediately instead, since
-- there is nothing live to protect.
ALTER TABLE faq_items RENAME COLUMN question    TO draft_question;
ALTER TABLE faq_items RENAME COLUMN answer      TO draft_answer;
ALTER TABLE faq_items RENAME COLUMN sort_order  TO draft_sort_order;
ALTER TABLE faq_items RENAME COLUMN enabled     TO draft_enabled;
ALTER TABLE faq_items RENAME COLUMN updated_at  TO draft_updated_at;

ALTER TABLE faq_items ADD COLUMN draft_updated_by TEXT;
ALTER TABLE faq_items ADD COLUMN draft_deleted    INTEGER NOT NULL DEFAULT 0;

-- NULL published_question means "never published" -- the public FAQ list
-- (which reads published_* only) never sees this row.
ALTER TABLE faq_items ADD COLUMN published_question    TEXT;
ALTER TABLE faq_items ADD COLUMN published_answer      TEXT;
ALTER TABLE faq_items ADD COLUMN published_sort_order  INTEGER;
ALTER TABLE faq_items ADD COLUMN published_enabled     INTEGER;
ALTER TABLE faq_items ADD COLUMN published_at          TEXT;
ALTER TABLE faq_items ADD COLUMN published_by          TEXT;

UPDATE faq_items SET
  published_question   = draft_question,
  published_answer     = draft_answer,
  published_sort_order = draft_sort_order,
  published_enabled    = draft_enabled,
  published_at         = draft_updated_at,
  published_by         = draft_updated_by
WHERE published_question IS NULL;

-- ────────────────────────────────────────────────────────── SETTINGS
--
-- Same treatment: draft_value is what the admin edits and what preview
-- reads, published_value is what the public site reads. Publishing
-- copies every key's draft_value to published_value in one action, since
-- the Settings form is one page, not five independent ones.
ALTER TABLE site_settings RENAME COLUMN value      TO draft_value;
ALTER TABLE site_settings RENAME COLUMN updated_at TO draft_updated_at;
ALTER TABLE site_settings RENAME COLUMN updated_by TO draft_updated_by;

ALTER TABLE site_settings ADD COLUMN published_value TEXT;
ALTER TABLE site_settings ADD COLUMN published_at    TEXT;
ALTER TABLE site_settings ADD COLUMN published_by    TEXT;

UPDATE site_settings SET
  published_value = draft_value,
  published_at    = draft_updated_at,
  published_by    = draft_updated_by
WHERE published_value IS NULL;

-- `site_name` is retired as an editable setting (client decision,
-- 2026-09-01): LAHAV AI is a protected business identity, not something
-- that should be casually renamed from the admin. The field existed but
-- was wired nowhere, which is worse than not having it -- see
-- docs/WEBSITE_CMS.md and SOURCE_OF_TRUTH.md F-36.
DELETE FROM site_settings WHERE key = 'site_name';
