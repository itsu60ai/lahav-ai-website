// Publish Settings' draft state: copies every key's draft_value onto
// published_value in one action. ADMIN only (settings:sensitive) -- the
// same permission that gates editing, since Settings has no EDITOR
// access at all (the whole page is admin-only, unchanged by this).
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ locals }) => {
  const denied = require_(locals.user, 'settings:sensitive');
  if (denied) return denied;

  await locals.stores!.settings.publish(locals.user!.id);
  await locals.stores!.audit.record('settings', 'published', locals.user!.id);

  return json({ ok: true });
};
