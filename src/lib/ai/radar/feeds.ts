// The trend radar's sources. Every URL here was fetched directly and
// confirmed to return 200 on 2026-08-30 (docs/AI_ENGINE.md section 4).
// All are official or well-established sources, all are free RSS/Atom,
// and none require an account or a key.
//
// Two sources named in the original request have NO free feed and are
// deliberately absent, rather than faked with a scraper:
//   - Anthropic: no RSS at any standard path (404 on every one tried).
//   - TikTok Creative Center: no free public API at all; its data sits
//     behind an authenticated business product. See docs/AI_ENGINE.md
//     section 4 for the honest alternative (a manual inspiration note in
//     the brief, verified like everything else before it becomes content).
import type { ContentKind } from '../types.ts';

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  /** relative trust used by score.ts; official product sources rank highest */
  weight: number;
  defaultContentKind: ContentKind;
}

export const FEED_SOURCES: FeedSource[] = [
  {
    id: 'google-search-central',
    name: 'Google Search Central',
    url: 'https://developers.google.com/search/blog/feed.xml',
    weight: 1.0,
    defaultContentKind: 'evergreen',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    url: 'https://openai.com/news/rss.xml',
    weight: 1.0,
    defaultContentKind: 'release',
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    url: 'https://blog.google/technology/ai/rss/',
    weight: 1.0,
    defaultContentKind: 'release',
  },
  {
    id: 'microsoft-azure',
    name: 'Microsoft Azure',
    url: 'https://azure.microsoft.com/en-us/blog/feed/',
    weight: 0.9,
    defaultContentKind: 'release',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    url: 'https://huggingface.co/blog/feed.xml',
    weight: 0.8,
    defaultContentKind: 'workflow',
  },
  {
    id: 'techcrunch-ai',
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    weight: 0.6,
    defaultContentKind: 'trend',
  },
  {
    id: 'theverge-ai',
    name: 'The Verge AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    weight: 0.6,
    defaultContentKind: 'trend',
  },
  {
    id: 'simon-willison',
    name: 'Simon Willison',
    url: 'https://simonwillison.net/atom/everything/',
    weight: 0.7,
    defaultContentKind: 'hack',
  },
];
