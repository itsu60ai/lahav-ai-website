-- F-46: lets the admin add their own radar feed sources (real RSS/Atom
-- URLs only) on top of the built-in list in src/lib/ai/radar/feeds.ts,
-- from the admin screen, no code deploy needed. See docs/AI_ENGINE.md
-- section 4 for why this is a URL field and not a free-text "search the
-- web for a topic" box: the radar only ever does real fetches against
-- real feeds, never a fabricated result.
CREATE TABLE IF NOT EXISTS ai_radar_sources (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  topic       TEXT NOT NULL DEFAULT '',
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL
);
