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

// Hebrew letters. An item written in Hebrew is Israeli for the purpose of
// the country filter, whatever the feed calls itself, and this is a fact
// about the text rather than a guess about the publisher.
const HEBREW = /[֐-׿]/;

function regionFor(sourceName: string, headline: string, summary: string): 'il' | 'intl' {
  if (HEBREW.test(sourceName) || HEBREW.test(headline) || HEBREW.test(summary)) return 'il';
  return ISRAELI_SOURCE_NAMES.has(sourceName) ? 'il' : 'intl';
}

// Israeli outlets that publish in English or with English titles, which the
// script check alone would miss.
const ISRAELI_SOURCE_NAMES = new Set([
  "Let's AI",
  'GeekTime TV',
  'Eyal Marcus',
  'https://letsai.co.il/',
]);

export async function collectOpportunities(stores: AiStores): Promise<CollectResult> {
  const result: CollectResult = { fetched: 0, created: 0, skippedDuplicate: 0, errors: [] };

  // Built-in sources plus whatever the admin added themselves on
  // /admin/ai/sources. Custom sources default to the 'hack' content kind
  // and a middle weight, since most are added for a specific niche topic
  // (F-46) rather than being an official product blog.
  const custom = await stores.radarSources.listActive();
  const allSources = [
    ...FEED_SOURCES,
    ...custom.map((c) => ({
      id: `custom-${c.id}`,
      name: c.name,
      url: c.url,
      weight: 0.6,
      defaultContentKind: 'hack' as const,
    })),
  ];

  for (const source of allSources) {
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
        region: regionFor(source.name, item.title, item.summary),
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
