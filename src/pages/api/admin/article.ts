// Create or update an article. Session + CSRF are already enforced by
// middleware; this route only validates the payload.
export const prerender = false;

import type { APIRoute } from 'astro';
import { slugify } from '../../../lib/cms/context.ts';
import { require_ } from '../../../lib/cms/guard.ts';
import { VIZ_KINDS, type Block } from '../../../lib/cms/types.ts';
import { isSvgSafe } from '../../../lib/ai/validate.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const has_ = (o: any, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const str = (v: unknown, max = 400) => (typeof v === 'string' ? v.slice(0, max) : '');

/** Only known block shapes survive. Anything else is dropped. */
function cleanBody(input: unknown): Block[] {
  if (!Array.isArray(input)) return [];
  const out: Block[] = [];
  for (const b of input.slice(0, 200)) {
    if (!b || typeof b !== 'object') continue;
    const t = (b as any).t;
    if (t === 'viz') out.push({ t: 'viz' });
    else if (t === 'aiviz') {
      // An AI-generated diagram, produced by src/lib/ai and untouched by
      // the block editor (see admin/[id].astro) — survives a normal save
      // exactly like any other block, re-validated here defensively so
      // this route never depends on validation done somewhere upstream.
      const svg = str((b as any).svg, 20000);
      if (svg && isSvgSafe(svg)) {
        out.push({ t: 'aiviz', svg, alt: str((b as any).alt, 300), caption: str((b as any).caption, 300) });
      }
    } else if (t === 'ul') {
      const items = Array.isArray((b as any).items)
        ? (b as any).items.map((i: unknown) => str(i, 400)).filter((i: string) => i.trim() !== '')
        : [];
      if (items.length) out.push({ t: 'ul', items });
    } else if (t === 'p' || t === 'h2' || t === 'h3' || t === 'quote') {
      out.push({ t, x: str((b as any).x, 4000) } as Block);
    }
  }
  return out;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = require_(locals.user, 'article:edit');
  if (denied) return denied;

  const { articles } = locals.stores!;
  let data: any;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  const id = str(data.id, 64);
  if (!id) return json({ error: 'missing id' }, 400);

  const current = await articles.get(id);
  if (!current) return json({ error: 'article not found' }, 404);

  const title = has_(data, 'title') ? str(data.title, 300) : current.title;

  // The slug is an article's public URL, so it changes ONLY when the
  // author actually supplies one. A partial update that omits it (or a
  // request from the future AI engine) must never silently move a
  // published page to a new address.
  let slug = current.slug;
  if (has_(data, 'slug')) {
    slug = slugify(str(data.slug, 200) || title || current.slug);
  }
  if (await articles.slugExists(slug, id)) {
    let n = 2;
    while (await articles.slugExists(`${slug}-${n}`, id)) n++;
    slug = `${slug}-${n}`;
  }

  const viz = VIZ_KINDS.includes(data.viz) ? data.viz : current.viz;
  const kind = data.kind === 'hack' ? 'hack' : 'guide';

  // Only fields actually present in the payload are written. A partial or
  // malformed request must never blank the rest of the article, which is
  // what an unconditional write would do.
  const patch: Record<string, unknown> = { slug };
  const has = (k: string) => Object.prototype.hasOwnProperty.call(data, k);

  if (has('title')) patch.title = title;
  if (has('kind')) patch.kind = kind;
  if (has('standfirst')) patch.standfirst = str(data.standfirst, 800);
  if (has('excerpt')) patch.excerpt = str(data.excerpt, 800);
  if (has('readingTime')) patch.readingTime = str(data.readingTime, 60);
  if (has('topic')) patch.topic = str(data.topic, 60);
  if (has('featured')) patch.featured = !!data.featured;
  if (has('isPlaceholder')) patch.isPlaceholder = !!data.isPlaceholder;
  if (has('viz')) patch.viz = viz;
  if (has('vizCaption')) patch.vizCaption = str(data.vizCaption, 400);
  if (has('serviceSlug')) patch.serviceSlug = str(data.serviceSlug, 60);
  if (has('serviceName')) patch.serviceName = str(data.serviceName, 120);
  if (has('body')) patch.body = cleanBody(data.body);

  const article = await articles.update(id, patch);

  return json({ ok: true, article });
};
