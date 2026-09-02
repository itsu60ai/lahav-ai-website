// Runs the free radar: fetch the verified feeds, store new opportunities.
// No AI call, no cost. See src/lib/ai/radar/collect.ts.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';
import { collectOpportunities } from '../../../../lib/ai/radar/collect.ts';

export const POST: APIRoute = async ({ locals, redirect }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const result = await collectOpportunities(getAiStores());
  // The result used to be silently discarded, so a real success looked
  // identical to a real failure -- the page just reloaded either way.
  // Carried back as query params so the admin sees exactly what happened.
  const params = new URLSearchParams({
    collected: '1',
    created: String(result.created),
    fetched: String(result.fetched),
    dup: String(result.skippedDuplicate),
    errors: String(result.errors.length),
  });
  return redirect(`/admin/ai?${params.toString()}`, 303);
};
