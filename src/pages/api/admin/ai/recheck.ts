// Re-runs the quality gates against the CURRENT state of the article —
// after the admin has edited it in the normal CMS editor — without
// recreating anything. Only the generation's gate results are updated;
// the article body, SEO, citations, visual, and every other field are
// read, never written, by this route.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';
import { runGates } from '../../../../lib/ai/gates.ts';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const f = await request.formData();
  const generationId = String(f.get('generationId') ?? '');
  if (!generationId) return redirect('/admin/ai', 303);

  const aiStores = getAiStores();
  const generation = await aiStores.generations.get(generationId);
  if (!generation || !generation.articleId || !generation.output) {
    return redirect('/admin/ai', 303);
  }

  const { articles } = locals.stores!;
  const [article, allArticles, opportunity] = await Promise.all([
    articles.get(generation.articleId),
    articles.list(),
    generation.opportunityId ? aiStores.opportunities.get(generation.opportunityId) : Promise.resolve(null),
  ]);
  if (!article) return redirect('/admin/ai', 303);

  // Re-check against what's actually in the CMS right now — title, body,
  // standfirst, excerpt can all have been hand-edited since generation.
  // SEO/citations/visual have no CMS editing surface today, so those stay
  // exactly as they were produced; re-running the gate against the current
  // seo/visual is still correct, just unaffected by article edits.
  const currentOutput = {
    ...generation.output,
    title: article.title,
    standfirst: article.standfirst,
    excerpt: article.excerpt,
    readingTime: article.readingTime,
    body: article.body,
  };

  const gates = runGates({
    output: currentOutput,
    opportunity,
    briefNotes: generation.brief.notes,
    contentKind: generation.brief.contentKind,
    // exclude the article itself, or the duplicate-topic check would
    // always match it against its own now-published slug/title
    existingArticles: allArticles.filter((a) => a.id !== article.id),
  });

  await aiStores.generations.update(generation.id, { gates, output: currentOutput });

  return redirect(`/admin/ai/${generation.id}`, 303);
};
