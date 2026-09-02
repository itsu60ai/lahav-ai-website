// C3: the human fact-verification write.
//
// docs/AI_ENGINE.md section 3.4 describes the free alternative to a paid
// verification search: the admin opens the source link, reads it, and
// confirms. This route is what records that. It is the ONLY place in the
// codebase that writes ai_opportunities.verified_by / verified_at, and the
// value it writes is taken from the signed-in session, never from the form
// body, so nobody can submit a form claiming somebody else verified it.
//
// runGates() reads those columns (see checkFactVerification in gates.ts),
// which is how a human confirmation satisfies the freshness/fact gate.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';
import type { VerificationState } from '../../../../lib/ai/types.ts';

const STATES: VerificationState[] = ['unverified', 'partial', 'verified'];

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const f = await request.formData();
  const id = String(f.get('id') ?? '').trim();
  const stateRaw = String(f.get('verification') ?? 'verified');
  const note = String(f.get('note') ?? '').trim();
  const back = String(f.get('back') ?? '/admin/ai');

  if (!id || !STATES.includes(stateRaw as VerificationState)) {
    return redirect('/admin/ai', 303);
  }

  // The identity comes from the session, not the request body.
  const who = locals.user!.name || locals.user!.email;

  await getAiStores().opportunities.setVerification(id, {
    verification: stateRaw as VerificationState,
    note,
    verifiedBy: who,
  });

  return redirect(back.startsWith('/admin/') ? back : '/admin/ai', 303);
};
