// Publish / unpublish. This is the only place article status changes.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../lib/cms/guard.ts';

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  // Publishing is the moment content becomes public in the company's
  // name, so it is admin only. Editors write and preview; they do not
  // decide what goes live.
  const denied = require_(locals.user, 'article:publish');
  if (denied) return denied;

  const { articles } = locals.stores!;
  const ct = request.headers.get('content-type') ?? '';
  let id = '';
  let status = '';
  let fromForm = false;

  if (ct.includes('application/json')) {
    const d = (await request.json().catch(() => ({}))) as { id?: unknown; status?: unknown };
    id = String(d.id ?? '');
    status = String(d.status ?? '');
  } else {
    const f = await request.formData();
    id = String(f.get('id') ?? '');
    status = String(f.get('status') ?? '');
    fromForm = true;
  }

  if (status !== 'draft' && status !== 'published') return json({ error: 'bad status' }, 400);
  const existing = await articles.get(id);
  if (!existing) return json({ error: 'article not found' }, 404);

  // Publishing something with no title or no body would put an empty page
  // on the public site, so it is refused here rather than in the UI only.
  if (status === 'published') {
    if (!existing.title.trim()) return json({ error: 'לא ניתן לפרסם מאמר בלי כותרת' }, 400);
    if (existing.body.length === 0) return json({ error: 'לא ניתן לפרסם מאמר בלי תוכן' }, 400);
  }

  const article = await articles.setStatus(id, status);
  return fromForm ? redirect('/admin', 303) : json({ ok: true, article });
};
