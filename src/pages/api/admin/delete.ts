export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../lib/cms/guard.ts';

export const POST: APIRoute = async ({ request, locals }) => {
  // Destroying content is admin only. An editor gets 403 here even if the
  // button was somehow present in their browser.
  const denied = require_(locals.user, 'article:delete');
  if (denied) return denied;

  const d = (await request.json().catch(() => ({}))) as any;
  const id = String(d.id ?? '');
  if (!id) return new Response(JSON.stringify({ error: 'missing id' }), { status: 400 });

  await locals.stores!.articles.remove(id);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
};
