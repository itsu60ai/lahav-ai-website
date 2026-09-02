-- 2026-09-02: give the four example projects a serviceSlug so each gets
-- its own detail-page layout (F-39). Chosen from each example's story;
-- editable in /admin/website/portfolio at any time.
UPDATE portfolio_items SET
  draft_json = json_set(draft_json, '$.serviceSlug', CASE json_extract(draft_json,'$.slug')
    WHEN 'hakerem-restaurant' THEN 'crm'
    WHEN 'shemesh-clinic' THEN 'automations'
    WHEN 'orly-boutique' THEN 'web-development'
    WHEN 'harechess-delivery' THEN 'app-development' ELSE '' END),
  published_json = json_set(published_json, '$.serviceSlug', CASE json_extract(published_json,'$.slug')
    WHEN 'hakerem-restaurant' THEN 'crm'
    WHEN 'shemesh-clinic' THEN 'automations'
    WHEN 'orly-boutique' THEN 'web-development'
    WHEN 'harechess-delivery' THEN 'app-development' ELSE '' END)
WHERE draft_deleted = 0 AND published_json IS NOT NULL;
