// SITEMAP.
//
// Generated per request rather than at build time, because the article
// list lives in the CMS and changes without a redeploy. Only PUBLISHED,
// non-placeholder articles are listed: a draft must not be discoverable
// through the sitemap any more than it is through a guessed URL.
import type { APIRoute } from 'astro';
import { SERVICES } from '../lib/site';

export const prerender = false;

const STATIC: { path: string; priority: string; freq: string }[] = [
  { path: '/', priority: '1.0', freq: 'weekly' },
  { path: '/services/', priority: '0.9', freq: 'monthly' },
  { path: '/about/', priority: '0.7', freq: 'monthly' },
  { path: '/articles/', priority: '0.8', freq: 'weekly' },
  { path: '/faq/', priority: '0.6', freq: 'monthly' },
  { path: '/contact/', priority: '0.9', freq: 'monthly' },
  { path: '/portfolio/', priority: '0.7', freq: 'monthly' },
  { path: '/privacy/', priority: '0.2', freq: 'yearly' },
];

export const GET: APIRoute = async ({ locals, url }) => {
  const origin = url.origin;
  const entries = [
    ...STATIC.map((s) => ({ loc: origin + s.path, priority: s.priority, freq: s.freq, lastmod: undefined as string | undefined })),
    ...SERVICES.map((s) => ({
      loc: `${origin}/services/${s.slug}/`,
      priority: '0.8',
      freq: 'monthly',
      lastmod: undefined as string | undefined,
    })),
  ];

  try {
    const articles = await (locals as any).stores?.articles?.list({ status: 'published' });
    for (const a of articles ?? []) {
      if (a.isPlaceholder) continue;
      entries.push({
        loc: `${origin}/articles/${a.slug}/`,
        priority: '0.7',
        freq: 'monthly',
        lastmod: a.updatedAt ?? a.publishedAt ?? undefined,
      });
    }
  } catch {
    // A CMS hiccup must not take the whole sitemap down: the static
    // routes are still worth serving.
  }

  // Portfolio detail pages were missing from the sitemap entirely, even
  // though /portfolio/ is in the main navigation and the pages are live.
  try {
    const items = await (locals as any).stores?.portfolioList?.listPublished();
    for (const it of items ?? []) {
      const slug = it?.content?.slug;
      if (!slug) continue;
      entries.push({
        loc: `${origin}/portfolio/${slug}/`,
        priority: '0.6',
        freq: 'monthly',
        lastmod: undefined as string | undefined,
      });
    }
  } catch {
    // Same reasoning as above.
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url>\n    <loc>${e.loc}</loc>\n${e.lastmod ? `    <lastmod>${String(e.lastmod).slice(0, 10)}</lastmod>\n` : ''}    <changefreq>${e.freq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=600',
    },
  });
};
