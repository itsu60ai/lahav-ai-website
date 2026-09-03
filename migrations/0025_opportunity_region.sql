-- F-48: a real region on every opportunity, so the ideas list can be
-- filtered by country the way the client asked for three times. A "source"
-- filter was offered twice as a substitute and rejected twice, correctly:
-- picking one outlet at a time is not the same question as "show me what
-- is happening in Israel".
--
-- Two values only, because only two are true here: 'il' for Israeli and
-- Hebrew-language sources, 'intl' for everything else.
ALTER TABLE ai_opportunities ADD COLUMN region TEXT NOT NULL DEFAULT 'intl';

-- Backfill. Sources known to be Israeli by name...
UPDATE ai_opportunities SET region = 'il' WHERE source_name IN (
  'Let''s AI', 'איילון גרופר', 'GeekTime TV', 'Eyal Marcus',
  'Digimate - Rani Ifrah (עברית)', 'https://letsai.co.il/'
);
-- ...plus anything whose headline actually contains Hebrew letters, which
-- catches sources added later without touching this file again.
UPDATE ai_opportunities SET region = 'il'
WHERE region = 'intl' AND (
  headline GLOB '*[אבגדהוזחטיכלמנסעפצקרשת]*'
  OR summary GLOB '*[אבגדהוזחטיכלמנסעפצקרשת]*'
);

CREATE INDEX IF NOT EXISTS idx_ai_opportunities_region ON ai_opportunities(region);
