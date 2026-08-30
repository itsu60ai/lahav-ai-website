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

  await collectOpportunities(getAiStores());
  return redirect('/admin/ai', 303);
};
