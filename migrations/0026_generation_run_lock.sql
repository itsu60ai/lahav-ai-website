-- F-49: a lock timestamp on ai_generations, so reopening the review screen
-- (or a second tab) while a paid generation is already in flight cannot
-- trigger a second, separately-billed call to Anthropic for the same row.
-- Set the moment /api/admin/ai/run actually starts calling the provider;
-- a run that finds one already set and recent refuses to start a second.
ALTER TABLE ai_generations ADD COLUMN run_started_at TEXT;
