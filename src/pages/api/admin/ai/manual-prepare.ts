// Stage B, step 1: assemble the complete prompt and save it as a pending
// generation — nothing is created in the CMS yet. The admin copies this
// prompt out to their own Claude/ChatGPT subscription; step 2
// (/admin/ai/manual/[id].astro, POST) is where the pasted reply comes back.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';
import { buildBriefFromForm } from '../../../../lib/ai/brief.ts';
import { assemblePrompt } from '../../../../lib/ai/prompt.ts';
import { buildManualPrompt } from '../../../../lib/ai/providers/manual.ts';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const aiStores = getAiStores();
  const { articles } = locals.stores!;
  const f = await request.formData();

  const brief = await buildBriefFromForm(f, aiStores);
  if (!brief) return redirect('/admin/ai', 303);

  const opportunity = brief.opportunityId ? await aiStores.opportunities.get(brief.opportunityId) : null;
  const [existingArticles, rules] = await Promise.all([articles.list(), aiStores.rules.listActive()]);
  const examples = existingArticles.filter((a) => a.status === 'published' && !a.isPlaceholder);

  const basePrompt = assemblePrompt({ brief, opportunity, examples, rules });
  const promptText = buildManualPrompt(basePrompt);

  const generation = await aiStores.generations.create({
    opportunityId: opportunity?.id ?? null,
    articleId: null,
    brief,
    providerMode: 'manual',
    model: 'manual-paste',
    promptText,
    output: null,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    status: 'pending',
    gates: { passed: false, failures: [] },
  });

  return redirect(`/admin/ai/manual/${generation.id}`, 303);
};
