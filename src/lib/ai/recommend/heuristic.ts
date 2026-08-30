// The free recommender. Zero cost, no network, runs automatically on every
// page load (subject to the cache window in recommend/index.ts). Every
// word of every "reason" sentence is built from a real, already-stored
// field — recency, source, priority, service match, related items found
// by real keyword overlap. Nothing here is invented or guessed at in the
// way a language model's phrasing would be; it is arithmetic and template
// text over facts the radar already collected. See docs/AI_ENGINE.md.
import { SERVICES } from '../../site.ts';
import type { ContentKind, Opportunity, Priority, Recommender } from '../types.ts';

const PRIORITY_LABEL: Record<Priority, string> = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };
const PRIORITY_BONUS: Record<Priority, number> = { high: 0.15, medium: 0.08, low: 0 };

// Per-kind angle templates, varied by real classification the radar
// already did — not one universal sentence. {SERVICE} is replaced with the
// actual matched service name when one was found.
const ANGLE_BY_KIND: Record<ContentKind, { withService: string; generic: string }> = {
  hack: {
    withService: 'הראו איך זה חוסך עבודה ידנית בתוך {SERVICE}, עם דוגמה קונקרטית שהלקוח יכול לזהות.',
    generic: 'הראו שלב-אחר-שלב איך בעל עסק קטן מיישם את זה בעצמו, בלי ז\'רגון טכני.',
  },
  release: {
    withService: 'הסבירו מה השינוי אומר בפועל למי שכבר משתמש ב{SERVICE}, לא רק מה השתנה בטכנולוגיה.',
    generic: 'תרגמו את העדכון הטכני לשפה של השפעה על עבודה יומיומית, לא של פיצ\'רים.',
  },
  workflow: {
    withService: 'חברו את התהליך החדש הזה ישירות ל{SERVICE}, עם השוואה לדרך הישנה.',
    generic: 'הציגו את התהליך כרעיון לבדיקה, לא כהמלצה גורפת, עד שהוא נבדק אצל לקוח אמיתי.',
  },
  comparison: {
    withService: 'מסגרו את ההשוואה סביב השאלה שלקוח של {SERVICE} באמת שואל, לא סביב מפרט טכני.',
    generic: 'תנו קריטריון בחירה אחד ברור, לא רשימת יתרונות וחסרונות.',
  },
  evergreen: {
    withService: 'עגנו את הנושא ב{SERVICE} כדי שהמאמר יוביל טבעי לשירות עצמו.',
    generic: 'שמרו על זה עצמאי ומועיל גם למי שלא מכיר את LAHAV AI בכלל.',
  },
  trend: {
    withService: 'קשרו את המגמה במפורש לאיך ש{SERVICE} רלוונטי כתגובה אליה, לא רק כתיאור המגמה.',
    generic: 'הישארו זהירים: זו מגמה, לא עובדה מוגמרת. הפרידו במפורש עובדה מפרשנות.',
  },
};

function buildAngle(opp: Opportunity): string {
  const service = SERVICES.find((s) => s.slug === opp.serviceSlug);
  const template = ANGLE_BY_KIND[opp.contentKind];
  return service ? template.withService.replace('{SERVICE}', service.name) : template.generic;
}

// Bounds the O(n²) related-item scan to a fixed cost regardless of how many
// opportunities the radar has accumulated (Workers CPU is metered per
// invocation) — the highest-scoring items are what matter for "today's
// picks" anyway.
const POOL_SIZE = 40;
const PICK_COUNT = 3;
const RELATED_WINDOW_DAYS = 5;
const RELATED_MAX = 3;
const DUPLICATE_OVERLAP_THRESHOLD = 0.6;

function significantTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/["'׳״]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const shared = [...a].filter((t) => b.has(t)).length;
  return shared / Math.min(a.size, b.size);
}

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;
}

function whenHebrew(publishedAt: string | null): string {
  if (!publishedAt) return 'לאחרונה';
  const days = Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86_400_000);
  if (days <= 0) return 'היום';
  if (days === 1) return 'אתמול';
  return `לפני ${days} ימים`;
}

function findRelated(target: Opportunity, pool: Opportunity[]): Opportunity[] {
  const targetTokens = significantTokens(target.headline);
  const related: Opportunity[] = [];
  for (const other of pool) {
    if (other.id === target.id) continue;
    const days = daysBetween(target.publishedAt, other.publishedAt);
    if (days !== null && days > RELATED_WINDOW_DAYS) continue;
    const sameService = target.serviceSlug && target.serviceSlug === other.serviceSlug;
    const tokenOverlap = overlapRatio(targetTokens, significantTokens(other.headline));
    if (sameService || tokenOverlap >= 0.3) related.push(other);
    if (related.length >= RELATED_MAX) break;
  }
  return related;
}

function compositeScore(opp: Opportunity, relatedCount: number): number {
  const serviceBonus = opp.serviceSlug ? 0.2 : 0;
  const relatedBonus = Math.min(relatedCount, RELATED_MAX) * 0.05;
  return opp.freshnessScore * 0.5 + serviceBonus + relatedBonus + PRIORITY_BONUS[opp.priority];
}

function buildReason(opp: Opportunity, related: Opportunity[]): string {
  const relatedNote =
    related.length > 0
      ? `, וקשור ל-${related.length} עדכונים נוספים בנושא דומה`
      : '';
  return `פורסם ב-${opp.sourceName} ${whenHebrew(opp.publishedAt)}, ודורג בעדיפות ${PRIORITY_LABEL[opp.priority]} מבין העדכונים האחרונים${relatedNote}.`;
}

export const heuristicRecommender: Recommender = {
  mode: 'heuristic',

  async recommend(opportunities: Opportunity[]) {
    const pool = [...opportunities]
      .sort((a, b) => b.freshnessScore - a.freshnessScore)
      .slice(0, POOL_SIZE);

    const scored = pool.map((opp) => {
      const related = findRelated(opp, pool);
      return { opp, related, score: compositeScore(opp, related.length) };
    });
    scored.sort((a, b) => b.score - a.score);

    const picks: Omit<import('../types.ts').RecommendationPick, 'rank'>[] = [];
    const chosenTokens: Set<string>[] = [];

    for (const candidate of scored) {
      if (picks.length >= PICK_COUNT) break;
      const tokens = significantTokens(candidate.opp.headline);
      const isDuplicateOfChosen = chosenTokens.some(
        (t) => overlapRatio(tokens, t) >= DUPLICATE_OVERLAP_THRESHOLD
      );
      if (isDuplicateOfChosen) continue;

      picks.push({
        opportunityId: candidate.opp.id,
        headline: candidate.opp.headline,
        reason: buildReason(candidate.opp, candidate.related),
        angle: buildAngle(candidate.opp),
        relatedOpportunityIds: candidate.related.map((r) => r.id),
        score: Math.round(candidate.score * 100) / 100,
      });
      chosenTokens.push(tokens);
    }

    return { picks, model: 'heuristic-v1', costUsd: 0 };
  },
};
