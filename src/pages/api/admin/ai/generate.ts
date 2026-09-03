// Generates a draft, either from an opportunity or from a manual brief
// typed directly into /admin/ai. Always creates a normal CMS draft; never
// publishes. See src/lib/ai/generate.ts.
//
// THE BROWSER NEVER WAITS FOR A MODEL (2026-09-03). Writing an article
// takes minutes and Cloudflare cuts a request off long before that, which
// is why every generation in production used to die as a 524 with the user
// staring at a spinner. This route now does the fast half only: create the
// row and redirect to it, instantly. The slow half runs from the review
// screen through /api/admin/ai/run.
//
// `mode=mock` on the form runs the free template generator no matter what
// ai_settings.provider_mode says, so the button labelled as a free test is
// always genuinely free.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';
import { buildBriefFromForm } from '../../../../lib/ai/brief.ts';
import { beginGeneration } from '../../../../lib/ai/generate.ts';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const aiStores = getAiStores();
  const { articles, media } = locals.stores!;
  const f = await request.formData();

  const brief = await buildBriefFromForm(f, aiStores);
  if (!brief) return redirect('/admin/ai?err=nobrief', 303);

  // Only 'mock' may be forced from a form, never 'api'. Choosing the PAID
  // provider is a settings:manage decision (see api/admin/ai/settings.ts);
  // article:create is enough to reach this route, and an editor posting
  // mode=api used to override an owner who had deliberately left the engine
  // on the free provider. Downgrading to free is safe; upgrading is not.
  const forceMode = String(f.get('mode') ?? '').trim() === 'mock' ? 'mock' : undefined;
  const args = { brief, aiStores, articles, media, createdBy: locals.user!.id, forceMode };

  let generationId: string;
  try {
    const started = await beginGeneration(args);
    generationId = started.id;
  } catch (e) {
    // A bad provider mode is the realistic case here, and it is worth
    // saying out loud rather than redirecting to a screen with no clue.
    const msg = e instanceof Error ? e.message : 'שגיאה לא צפויה';
    return redirect(`/admin/ai?err=start&detail=${encodeURIComponent(msg.slice(0, 200))}`, 303);
  }

  // The slow half is NOT started here. waitUntil() was tried and measured:
  // a free mock generation finished that way, but a real Anthropic one was
  // killed mid-flight and left the row stuck on 'pending'. Cloudflare does
  // not keep a detached background task alive for minutes.
  //
  // What it does keep alive is a Worker that is streaming to a client that
  // is still reading, so the review screen this redirect lands on opens
  // /api/admin/ai/run and holds that connection until the article is
  // written. See the header of that file for the full measurement.
  return redirect(`/admin/ai/${generationId}`, 303);
};
