-- The recommendation layer: "here are the topics worth writing about today,
-- and why", computed from the opportunities the radar already collects.
-- See docs/AI_ENGINE.md.
--
-- Two providers, same pattern as ai_generations/provider_mode: a free
-- heuristic (real math over real stored data, zero cost, runs
-- automatically) and an 'api' mode that is WIRED but not implemented — see
-- src/lib/ai/recommend/index.ts. Nothing in this file or its code path can
-- call a paid API; recommendation_mode defaults to 'heuristic' and stays
-- there until a human explicitly changes it.

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id           TEXT PRIMARY KEY,
  mode         TEXT NOT NULL DEFAULT 'heuristic', -- heuristic | api
  model        TEXT NOT NULL DEFAULT 'heuristic-v1',
  cost_usd     REAL NOT NULL DEFAULT 0,
  -- array of { opportunityId, rank, headline, reason, angle,
  --            relatedOpportunityIds, score }
  picks_json   TEXT NOT NULL DEFAULT '[]',
  created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created ON ai_recommendations(created_at);

-- Which mode computes the "today's picks" card. Defaults to the free
-- heuristic; switching this to 'api' is a deliberate future step, not
-- something any code path does on its own.
ALTER TABLE ai_settings ADD COLUMN recommendation_mode TEXT NOT NULL DEFAULT 'heuristic';
