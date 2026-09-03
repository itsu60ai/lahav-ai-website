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

  // The admin list dismisses over fetch and removes the row itself, so it
  // asks for JSON and never pays for a full re-render of 300+ items. The
  // redirect stays for the no-JS path, and now keeps you on the tab and
  // filters you were actually looking at instead of resetting to the top
  // of an unfiltered list.
  if ((request.headers.get('accept') ?? '').includes('application/json')) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }
  const back = String(f.get('back') ?? '');
  return redirect(back.startsWith('/admin/') ? back : '/admin/ai', 303);
};
