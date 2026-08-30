// The recommendation orchestrator. THIS IS THE ONE PLACE THAT PICKS A
// RECOMMENDER, mirroring generate.ts's pickProvider() exactly on purpose.
//
// getOrComputeRecommendation() is what makes the free tier "automatic":
// called from the admin page on every load, it reuses a recent run instead
// of recomputing (and re-billing, once 'api' mode exists) on every single
// page view. A future Cloudflare Cron Trigger would call this exact same
// function on a schedule — nothing about this function assumes it is
// running inside an HTTP request, so wiring that trigger later needs no
// change here.
import type { AiStores, RecommendationMode, RecommendationRun, Recommender } from '../types.ts';
import { heuristicRecommender } from './heuristic.ts';

const DEFAULT_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

function pickRecommender(mode: RecommendationMode): Recommender {
  if (mode === 'heuristic') return heuristicRecommender;
  // Wired, not built: recommendation_mode can only become 'api' through a
  // direct database change today (there is no toggle in the UI yet,
  // because flipping it would only reach this line and stop here). When
  // real AI reasoning is built, this is the only line that changes.
  throw new Error(
    'מצב המלצות "api" מחובר לארכיטקטורה אך טרם מומש. הפעלה אמיתית דורשת אישור מפורש ושימוש בתשלום.'
  );
}

export async function getOrComputeRecommendation(
  stores: AiStores,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS
): Promise<RecommendationRun | null> {
  const cached = await stores.recommendations.latest(maxAgeMs);
  if (cached) return cached;

  const settings = await stores.settings.get();
  const opportunities = await stores.opportunities.list({ status: 'new' });
  if (opportunities.length === 0) return null;

  const recommender = pickRecommender(settings.recommendationMode);
  const { picks, model, costUsd } = await recommender.recommend(opportunities);

  return stores.recommendations.create({
    mode: recommender.mode,
    model,
    costUsd,
    picks: picks.map((p, i) => ({ ...p, rank: i + 1 })),
  });
}
