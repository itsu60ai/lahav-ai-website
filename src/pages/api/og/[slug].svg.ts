// C4: a stable public URL for an article's own generated diagram.
//
// WHAT THIS DOES: serves the SVG stored in ai_assets for a published
// article, at /api/og/<slug>.svg. Free, no dependency, no image API, and
// the picture is the article's own on-brand diagram rather than a stock
// illustration (docs/AI_ENGINE.md section 7).
//
// WHAT THIS DELIBERATELY DOES NOT DO, and why, stated honestly rather
// than papered over:
//
//   It does not produce a PNG. Rasterising SVG inside a Cloudflare Worker
//   requires a WebAssembly renderer (resvg-wasm, or satori plus a
//   rasteriser) plus an embedded Hebrew font file. That is a heavy new
//   dependency and a large bundle, which this build was asked not to add,
//   and no paid image API is used either.
//
//   Because WhatsApp, LinkedIn and X do not render SVG for link previews,
//   `og:image` on an article page therefore still points at the existing
//   raster default (/brand/og-default.png, wired in BaseLayout.astro).
//   That is the limitation. It is recorded here rather than hidden.
//
//   The two ways to close it later, neither of which needs this file to
//   change: (1) render the SVG to PNG at build time for published
//   articles and write the file into /public, which is the option
//   docs/AI_ENGINE.md section 7 recommends and which costs nothing;
//   (2) add a wasm rasteriser to this route. Option 1 is preferred.
//
// SAFETY: the stored markup is re-checked with isSvgSafe() on the way out,
// not merely on the way in. The stored SVG is generated content, and a
// public endpoint must not depend on a check that happened in the past.
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAiStores } from '../../../lib/ai/context.ts';
import { isSvgSafe } from '../../../lib/ai/validate.ts';

const NOT_FOUND = new Response(null, { status: 404, statusText: 'Not found' });

export const GET: APIRoute = async ({ params, locals }) => {
  const slug = String(params.slug ?? '');
  if (!slug) return NOT_FOUND;

  const { articles } = locals.stores!;
  const article = await articles.getBySlug(slug);

  // Only published articles resolve, matching /articles/[slug].astro. A
  // draft's diagram must not be reachable by guessing a URL either.
  if (!article || article.status !== 'published') return NOT_FOUND;

  const assets = await getAiStores().assets.listByArticle(article.id);
  // Prefer the hero-sized asset when there is one; it is the 1200x630
  // shape social cards expect.
  const asset = assets.find((a) => a.kind === 'hero') ?? assets[0];
  if (!asset?.svgMarkup || !isSvgSafe(asset.svgMarkup)) return NOT_FOUND;

  return new Response(asset.svgMarkup, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      // The diagram only changes when the article is regenerated, so a
      // long public cache is safe and keeps this off the request path.
      'cache-control': 'public, max-age=3600, s-maxage=86400',
      'x-content-type-options': 'nosniff',
    },
  });
};
