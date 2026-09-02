-- 2026-09-02, client instruction "תדחוף את כל השינויים לאתר החי":
-- publish the About page's partnership content (F-43) to production.
UPDATE content_pages SET published_json = draft_json, published_at = datetime('now')
  WHERE id = 'about';
