// Publish the FAQ's draft state: copies every non-deleted item's draft
// fields onto its published fields, and permanently removes anything
// staged for deletion. ADMIN only (faq:publish) -- the moment the list a
// visitor sees actually changes.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ locals }) => {
  const denied = require_(locals.user, 'faq:publish');
  if (denied) return denied;

  await locals.stores!.faq.publishAll(locals.user!.id);
  await locals.stores!.audit.record('faq', 'published', locals.user!.id);

  return json({ ok: true });
};
