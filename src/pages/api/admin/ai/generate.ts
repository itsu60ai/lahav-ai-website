// Generates a draft, either from an opportunity or from a manual brief
// typed directly into /admin/ai. Always creates a normal CMS draft; never
// publishes. See src/lib/ai/generate.ts.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';
import { buildBriefFromForm } from '../../../../lib/ai/brief.ts';
import { generateDraft } from '../../../../lib/ai/generate.ts';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const aiStores = getAiStores();
  const { articles } = locals.stores!;
  const f = await request.formData();

  const brief = await buildBriefFromForm(f, aiStores);
  if (!brief) return redirect('/admin/ai', 303);

  const { generation } = await generateDraft({ brief, aiStores, articles });
  return redirect(`/admin/ai/${generation.id}`, 303);
};
