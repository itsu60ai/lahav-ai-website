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
  // 'api' is wired, not built. It used to throw here, which meant a value
  // saved in settings took the whole AI screen down; that happened in
  // production on 2026-09-02. Falling back to the FREE recommender is
  // both safer and honest: it cannot silently start billing (heuristic
  // costs nothing), and the admin screen states which mode actually ran.
  // When real AI reasoning is built, this is the only line that changes.
  return heuristicRecommender;
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
