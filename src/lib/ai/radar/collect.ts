// Orchestrates the free radar: fetch the verified feeds, parse, score, and
// store as opportunities. Real HTTP fetches against real official sources —
// not a mock — because collection genuinely is free (docs/AI_ENGINE.md
// section 3.2). No AI call anywhere in this file.
//
// "why it matters" and "suggested angle" are template sentences here, not
// AI writing. They are a starting point the admin edits before generating,
// and they cost nothing to produce.
import type { AiStores, ContentKind } from '../types.ts';
import { FEED_SOURCES } from './feeds.ts';
import { parseFeed } from './parse.ts';
import { scoreItem } from './score.ts';

const CONTENT_KIND_WHY: Record<ContentKind, string> = {
  hack: 'עדכון פרקטי שיכול לחסוך עבודה ידנית לבעלי עסקים, אם יאומת ויותאם.',
  release: 'שינוי במוצר שכלי AI מרכזי משתמשים בו, שיכול להשפיע על תהליכי עבודה קיימים.',
  workflow: 'דרך עבודה חדשה שרלוונטית לעסקים קטנים אם היא נבדקת ומותאמת נכון.',
  comparison: 'השוואה שיכולה לעזור לבעל עסק לבחור נכון בין כלים.',
  evergreen: 'נושא יסוד שרלוונטי לאורך זמן לבעלי עסקים.',
  trend: 'מגמה שכדאי להכיר, בכפוף להפרדה ברורה בין עובדה לפרשנות.',
};

export interface CollectResult {
  fetched: number;
  created: number;
  skippedDuplicate: number;
  errors: { source: string; message: string }[];
}

export async function collectOpportunities(stores: AiStores): Promise<CollectResult> {
  const result: CollectResult = { fetched: 0, created: 0, skippedDuplicate: 0, errors: [] };

  for (const source of FEED_SOURCES) {
    let xml: string;
    try {
      const res = await fetch(source.url, {
        headers: { 'user-agent': 'LAHAV-AI-Radar/1.0 (+https://lahav.ai)' },
      });
      if (!res.ok) {
        result.errors.push({ source: source.name, message: `HTTP ${res.status}` });
        continue;
      }
      xml = await res.text();
    } catch (e) {
      result.errors.push({ source: source.name, message: e instanceof Error ? e.message : 'fetch failed' });
      continue;
    }

    const items = parseFeed(xml);
    result.fetched += items.length;

    for (const item of items) {
      if (await stores.opportunities.urlExists(item.link)) {
        result.skippedDuplicate += 1;
        continue;
      }

      const scored = scoreItem(item, source);
      await stores.opportunities.create({
        sourceName: source.name,
        sourceUrl: item.link,
        publishedAt: item.publishedAt,
        headline: item.title,
        summary: item.summary.slice(0, 500),
        whyItMatters: CONTENT_KIND_WHY[scored.contentKind],
        suggestedAngle: `כתבה בזווית LAHAV AI: מה זה אומר בפועל לבעל עסק ישראלי קטן, ומה כדאי לבדוק לפני שמאמצים את זה.`,
        contentKind: scored.contentKind,
        serviceSlug: scored.serviceSlug,
        verification: 'unverified',
        verificationNote: '',
        freshnessScore: scored.freshnessScore,
        priority: scored.priority,
      });
      result.created += 1;
    }
  }

  return result;
}
