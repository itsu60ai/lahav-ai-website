-- 2026-09-02, client noticed the portfolio link is missing from the menu:
-- the navigation row still has "/portfolio/" disabled from when the
-- portfolio was a hidden preview (docs/WEBSITE_CMS.md). The four example
-- projects are published and live; the client asked for the section to
-- be visible, so this enables the nav link on both draft and published.
UPDATE content_pages
SET draft_json = json_set(draft_json, '$.items[5].enabled', json('true')),
    published_json = json_set(published_json, '$.items[5].enabled', json('true')),
    published_at = datetime('now')
WHERE id = 'navigation'
  AND json_extract(draft_json, '$.items[5].key') = '/portfolio/';
