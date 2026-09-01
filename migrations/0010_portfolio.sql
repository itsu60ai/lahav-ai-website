-- Portfolio ("תיק עבודות"), 2026-09-01.
--
-- A growable list of example projects, same draft/published discipline as
-- everywhere else. Each row is one project: a JSON content blob (name,
-- industry, hero image, story, SEO -- including its own `slug`, which
-- lives inside the JSON rather than as a separate column, so admin
-- operations always key off the stable `id`) plus the same
-- draft/published sort_order, enabled and deleted flags FAQ items use.
--
-- These items are entirely fictional examples (client instruction,
-- 2026-09-01): no real company is named or implied. Not published by
-- default, and not linked from the navigation by default -- see the
-- `navigation` content_pages row update below.
CREATE TABLE IF NOT EXISTS portfolio_items (
  id                    TEXT PRIMARY KEY,
  draft_json            TEXT NOT NULL,
  draft_sort_order      INTEGER NOT NULL DEFAULT 0,
  draft_enabled         INTEGER NOT NULL DEFAULT 1,
  draft_deleted         INTEGER NOT NULL DEFAULT 0,
  draft_updated_at      TEXT NOT NULL,
  draft_updated_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  published_json        TEXT,
  published_sort_order  INTEGER,
  published_enabled     INTEGER,
  published_at          TEXT,
  published_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
  -- DEFAULT, not just NOT NULL: content_pages/services_content have no
  -- `created_at` column at all, so the shared D1ContentPageStore's
  -- INSERT ... ON CONFLICT DO UPDATE (saveDraft) never sets it. SQLite
  -- validates every NOT NULL constraint on the row being inserted BEFORE
  -- deciding whether a uniqueness conflict redirects to the UPDATE
  -- branch -- a NOT NULL failure on an unrelated column aborts the whole
  -- statement rather than falling through, even when the row already
  -- exists and the practical effect would have been a normal update.
  -- Found by testing (a real INSERT attempt against an existing row failed
  -- with "NOT NULL constraint failed: portfolio_items.created_at").
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The portfolio INDEX page's own hero copy + SEO lives as a normal
-- content_pages row, exactly like every other page -- no new mechanism.
INSERT INTO content_pages (id, draft_json, draft_updated_at, published_json, published_at)
SELECT 'portfolio',
  '{"hero":{"eyebrow":"תיק עבודות","headlineLine1":"דוגמאות לעבודה","headlineLine2":"שאנחנו גאים בה.","lead":"פרויקטים לדוגמה שממחישים איך אנחנו חושבים על מערכות ואוטומציה."},"seo":{"title":"תיק עבודות | LAHAV AI","description":"דוגמאות לפרויקטים: איך אנחנו הופכים בעיה עסקית למערכת שעובדת.","ogTitle":"תיק עבודות | LAHAV AI","ogDescription":"דוגמאות לפרויקטים: איך אנחנו הופכים בעיה עסקית למערכת שעובדת.","ogImage":"","noindex":true}}',
  datetime('now'),
  '{"hero":{"eyebrow":"תיק עבודות","headlineLine1":"דוגמאות לעבודה","headlineLine2":"שאנחנו גאים בה.","lead":"פרויקטים לדוגמה שממחישים איך אנחנו חושבים על מערכות ואוטומציה."},"seo":{"title":"תיק עבודות | LAHAV AI","description":"דוגמאות לפרויקטים: איך אנחנו הופכים בעיה עסקית למערכת שעובדת.","ogTitle":"תיק עבודות | LAHAV AI","ogDescription":"דוגמאות לפרויקטים: איך אנחנו הופכים בעיה עסקית למערכת שעובדת.","ogImage":"","noindex":true}}',
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM content_pages WHERE id = 'portfolio');

-- Add the nav entry, DISABLED by default (client instruction: build it,
-- but do not put it live yet). An admin flips it on from the existing
-- Navigation editor when ready -- no code change needed to launch it.
UPDATE content_pages
SET draft_json = json_set(draft_json, '$.items[#]',
      json('{"key":"/portfolio/","label":"תיק עבודות","enabled":false}')),
    published_json = json_set(published_json, '$.items[#]',
      json('{"key":"/portfolio/","label":"תיק עבודות","enabled":false}'))
WHERE id = 'navigation'
  AND NOT EXISTS (
    SELECT 1 FROM json_each(draft_json, '$.items') WHERE json_extract(value, '$.key') = '/portfolio/'
  );
