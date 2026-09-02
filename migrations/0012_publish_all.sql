-- 2026-09-02, client instruction "תפרסם הכל גם במקומי וגם בחי":
-- publish COPY V2 drafts on every page and service, and enable + publish
-- the four example portfolio projects.
UPDATE content_pages SET published_json = draft_json, published_at = datetime('now')
  WHERE id IN ('home','about','contact','faq','footer');
UPDATE services_content SET published_json = draft_json, published_at = datetime('now');
UPDATE portfolio_items SET draft_enabled = 1, published_json = draft_json,
  published_sort_order = draft_sort_order, published_enabled = 1, published_at = datetime('now')
  WHERE draft_deleted = 0;
