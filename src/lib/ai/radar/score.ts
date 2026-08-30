// The free heuristic scorer. See docs/AI_ENGINE.md section 3.2: AI ranking
// of radar items is an upgrade to a working feature, not a prerequisite for
// one. This is that working feature: recency decay + source trust +
// keyword match against LAHAV AI's own services, no model call involved.
import type { ContentKind, Priority } from '../types.ts';
import type { FeedItem } from './parse.ts';
import type { FeedSource } from './feeds.ts';

// English keywords, because every source feed here is in English. Mapped
// to the SERVICES[].slug values in src/lib/site.ts.
const SERVICE_KEYWORDS: { slug: string; words: string[] }[] = [
  { slug: 'crm', words: ['crm', 'customer relationship', 'sales pipeline', 'lead management'] },
  { slug: 'automations', words: ['automation', 'workflow', 'zapier', 'n8n', 'agent', 'agentic'] },
  { slug: 'web-development', words: ['website', 'web design', 'landing page', 'web development'] },
  { slug: 'app-development', words: ['app development', 'mobile app', 'application', 'software product'] },
  { slug: 'ai-content', words: ['content creation', 'copywriting', 'marketing content', 'writing assistant'] },
];

function matchService(text: string): string {
  const lower = text.toLowerCase();
  for (const s of SERVICE_KEYWORDS) {
    if (s.words.some((w) => lower.includes(w))) return s.slug;
  }
  return '';
}

const HACK_WORDS = ['tip', 'trick', 'shortcut', 'how to', 'workflow', 'guide'];
const RELEASE_WORDS = ['launch', 'release', 'introduc', 'announce', 'ships', 'available now'];
const COMPARISON_WORDS = [' vs ', 'versus', 'compare', 'comparison'];

function guessContentKind(text: string, fallback: ContentKind): ContentKind {
  const lower = text.toLowerCase();
  if (COMPARISON_WORDS.some((w) => lower.includes(w))) return 'comparison';
  if (RELEASE_WORDS.some((w) => lower.includes(w))) return 'release';
  if (HACK_WORDS.some((w) => lower.includes(w))) return 'hack';
  return fallback;
}

/** 1.0 = published today, decaying to ~0 over two weeks */
function recencyScore(publishedAt: string | null): number {
  if (!publishedAt) return 0.3; // unknown date: assume moderately fresh, never zero
  const ageDays = (Date.now() - new Date(publishedAt).getTime()) / 86_400_000;
  if (ageDays < 0) return 1;
  return Math.max(0, 1 - ageDays / 14);
}

export function scoreItem(item: FeedItem, source: FeedSource): {
  freshnessScore: number;
  priority: Priority;
  contentKind: ContentKind;
  serviceSlug: string;
} {
  const text = `${item.title} ${item.summary}`;
  const freshness = recencyScore(item.publishedAt);
  const combined = freshness * 0.6 + source.weight * 0.4;

  const priority: Priority = combined >= 0.7 ? 'high' : combined >= 0.4 ? 'medium' : 'low';

  return {
    freshnessScore: Math.round(combined * 100) / 100,
    priority,
    contentKind: guessContentKind(text, source.defaultContentKind),
    serviceSlug: matchService(text),
  };
}
