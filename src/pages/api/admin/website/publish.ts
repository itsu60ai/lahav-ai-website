// Publish: copy a content area's draft over its published copy. This is
// the moment content goes live in the company's name, so it requires
// content:publish (ADMIN only) rather than content:edit (ADMIN + EDITOR).
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = require_(locals.user, 'content:publish');
  if (denied) return denied;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  const storeName = body.store === 'services' ? 'services' : 'content';
  const store = storeName === 'services' ? locals.stores!.services : locals.stores!.content;
  const id = typeof body.id === 'string' ? body.id.slice(0, 64) : '';
  if (!id) return json({ error: 'missing id' }, 400);

  await store.publish(id, locals.user!.id);
  await locals.stores!.audit.record(`${storeName}:${id}`, 'published', locals.user!.id);

  return json({ ok: true });
};
