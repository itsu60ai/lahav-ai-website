// C2: the learned rules are the system's readable memory, so they must be
// correctable by hand. docs/AI_ENGINE.md section 10: "a rule that is wrong
// gets deleted by you. The learning stays inspectable and correctable,
// which is the whole reason for preferring this over fine tuning."
//
// PERMISSIONS, and why they split where they do:
//   read / add / edit / deactivate  -> `article:create`
//        These are the same authority as writing content: an editor who
//        may write articles may also correct the notes that steer them,
//        and deactivating is fully reversible.
//   delete                          -> `settings:manage`
//        Deleting destroys the record of a correction permanently and
//        cannot be undone, so it sits with the same admin-only authority
//        as the rest of the engine's irreversible switches. Deactivate is
//        the reversible option available to everyone else.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';

const BACK = '/admin/ai/rules';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const f = await request.formData();
  const action = String(f.get('action') ?? '');
  const id = String(f.get('id') ?? '').trim();
  const stores = getAiStores();

  if (action === 'delete') {
    const denied = require_(locals.user, 'settings:manage');
    if (denied) return denied;
    if (id) await stores.rules.remove(id);
    return redirect(`${BACK}?done=deleted`, 303);
  }

  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  if (action === 'add') {
    const text = String(f.get('ruleText') ?? '').trim();
    if (!text) return redirect(`${BACK}?err=empty`, 303);
    await stores.rules.upsertByText(text);
    return redirect(`${BACK}?done=added`, 303);
  }

  if (action === 'edit' && id) {
    const text = String(f.get('ruleText') ?? '').trim();
    // An empty rule would silently become a no-op instruction in the
    // prompt, so it is refused rather than saved as a blank line.
    if (!text) return redirect(`${BACK}?err=empty`, 303);
    await stores.rules.updateText(id, text);
    return redirect(`${BACK}?done=saved`, 303);
  }

  if ((action === 'activate' || action === 'deactivate') && id) {
    await stores.rules.setActive(id, action === 'activate');
    return redirect(`${BACK}?done=${action === 'activate' ? 'activated' : 'deactivated'}`, 303);
  }

  return redirect(BACK, 303);
};
