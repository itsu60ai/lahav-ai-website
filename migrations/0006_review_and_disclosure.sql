-- Two small additions from the Stage B review-experience pass
-- (docs/AI_ENGINE.md; client feedback 2026-09-01):
--
-- 1. The AI-disclosure sentence was being appended to every manual-mode
--    article unconditionally. The client asked for this to be OFF by
--    default (capability kept, not forced) until explicitly configured —
--    no invented legal requirement.
ALTER TABLE ai_settings ADD COLUMN disclosure_enabled INTEGER NOT NULL DEFAULT 0;

-- 2. Duplicate-topic gate failures need to carry which article they
-- matched (id/slug/title), not just a message string, so the review
-- screen can link straight to it. Nothing here is a schema change for
-- that — gate_results_json already stores arbitrary JSON — this migration
-- only covers the settings column above.
