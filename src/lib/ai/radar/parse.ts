// A minimal, dependency-free RSS 2.0 / Atom parser.
//
// Cloudflare Workers has no DOMParser and this project adds no new
// dependency for it, so this is a small regex-based extractor rather than
// a spec-complete XML parser. It handles the two real shapes
// (<item>...</item> and <entry>...</entry>), CDATA sections, and the
// handful of HTML entities that actually appear in these particular
// feeds. It is not a general-purpose XML parser and should not be
// treated as one; if a new feed is added later and comes back empty,
// that is the first thing to check.
export interface FeedItem {
  title: string;
  link: string;
  publishedAt: string | null;
  summary: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    // numeric entities first (decimal &#8217; and hex &#x2019;) — these are
    // common in real feeds (curly quotes, em dashes in source titles, etc.)
    // and were previously left as raw markup in every headline.
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decodeEntities(m[1]) : '';
}

function extractAtomLink(block: string): string {
  // Atom: <link href="..." /> (self-closing, attribute-based)
  const m = block.match(/<link\b[^>]*href="([^"]+)"[^>]*\/?>/i);
  return m ? m[1] : '';
}

function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function parseFeed(xml: string, maxItems = 15): FeedItem[] {
  const items: FeedItem[] = [];

  const rssBlocks = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ?? [];
  const atomBlocks = xml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) ?? [];

  for (const block of rssBlocks) {
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link') || extractAtomLink(block);
    if (!title || !link) continue;
    items.push({
      title,
      link,
      publishedAt: normalizeDate(extractTag(block, 'pubDate')),
      summary: extractTag(block, 'description') || extractTag(block, 'content:encoded'),
    });
  }

  for (const block of atomBlocks) {
    const title = extractTag(block, 'title');
    const link = extractAtomLink(block) || extractTag(block, 'link');
    if (!title || !link) continue;
    items.push({
      title,
      link,
      publishedAt: normalizeDate(extractTag(block, 'updated') || extractTag(block, 'published')),
      summary: extractTag(block, 'summary') || extractTag(block, 'content'),
    });
  }

  return items.slice(0, maxItems);
}
