// Marks an opportunity as dismissed. It stays in the database (full
// history), it just stops showing in the "new" list.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const f = await request.formData();
  const id = String(f.get('id') ?? '');
  if (id) await getAiStores().opportunities.setStatus(id, 'dismissed');
  return redirect('/admin/ai', 303);
};
