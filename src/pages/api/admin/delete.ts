export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../lib/cms/guard.ts';

export const POST: APIRoute = async ({ request, locals }) => {
  // Destroying content is admin only. An editor gets 403 here even if the
  // button was somehow present in their browser.
  const denied = require_(locals.user, 'article:delete');
  if (denied) return denied;

  const d = (await request.json().catch(() => ({}))) as any;

  // Bulk form, for the article list's select-many checkbox row. Same
  // permission check, same removal call, just looped -- no separate
  // "bulk delete" capability exists, only a convenience for calling this
  // one proven path several times in one request instead of N round trips.
  if (Array.isArray(d.ids)) {
    const ids = d.ids.map((v: unknown) => String(v)).filter(Boolean).slice(0, 200);
    let removed = 0;
    for (const id of ids) {
      await locals.stores!.articles.remove(id);
      removed++;
    }
    return new Response(JSON.stringify({ ok: true, removed }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const id = String(d.id ?? '');
  if (!id) return new Response(JSON.stringify({ error: 'missing id' }), { status: 400 });

  await locals.stores!.articles.remove(id);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
};
