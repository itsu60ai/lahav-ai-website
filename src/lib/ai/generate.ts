// The orchestrator. THIS IS THE ONE PLACE THAT TIES A PROVIDER TO THE CMS.
//
// The flow matches docs/AI_ENGINE.md section 2 exactly: assemble the
// prompt, call the provider, validate, gate, then create a normal draft
// through the EXISTING ArticleStore — the same one the manual editor uses.
// This function never sets an article's status to "published"; it always
// creates a draft.
import { newId, slugify } from '../cms/context.ts';
import type { ArticleStore, VizKind } from '../cms/types.ts';
import { SERVICES } from '../site.ts';
import { assemblePrompt } from './prompt.ts';
import { runGates } from './gates.ts';
import { contentKindToArticleKind, vizForServiceSlug } from './mapping.ts';
import { mockGenerator } from './providers/mock.ts';
import { validateGeneratorOutput } from './validate.ts';
import type { AiStores, Brief, Generation, TextGenerator } from './types.ts';

function pickProvider(mode: string): TextGenerator {
  if (mode === 'mock') return mockGenerator;
  // Stage B (manual paste) and Stage D (a real API) are designed but not
  // built — see docs/AI_ENGINE.md. Failing loudly here is the point: a
  // setting that silently fell back to mock would hide a real gap.
  throw new Error(
    `מצב ספק "${mode}" עדיין לא מוטמע. שלב א' תומך רק במצב בדיקה (mock). ראו docs/AI_ENGINE.md.`
  );
}

export interface GenerateArgs {
  brief: Brief;
  aiStores: AiStores;
  articles: ArticleStore;
}

export interface GenerateResult {
  generation: Generation;
  articleId: string | null;
}

export async function generateDraft(args: GenerateArgs): Promise<GenerateResult> {
  const { brief, aiStores, articles } = args;

  const opportunity = brief.opportunityId ? await aiStores.opportunities.get(brief.opportunityId) : null;
  const settings = await aiStores.settings.get();
  const provider = pickProvider(settings.providerMode);

  const [existingArticles, rules] = await Promise.all([
    articles.list(),
    aiStores.rules.listActive(),
  ]);
  const examples = existingArticles.filter((a) => a.status === 'published' && !a.isPlaceholder);

  const promptText = assemblePrompt({ brief, opportunity, examples, rules });

  let articleId: string | null = null;
  let status: 'succeeded' | 'failed' = 'failed';
  let outputForLog = null as Generation['output'];
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;
  let model: string = provider.mode;
  let gates = { passed: false, failures: [{ gate: 'internal', message: 'לא הושלם' }] };

  try {
    const { output, meta } = await provider.generate({ brief, opportunity, promptText });
    outputForLog = output;
    inputTokens = meta.inputTokens;
    outputTokens = meta.outputTokens;
    costUsd = meta.costUsd;
    model = meta.model;

    const validation = validateGeneratorOutput(output);
    if (!validation.ok) {
      gates = { passed: false, failures: validation.errors.map((message) => ({ gate: 'validation', message })) };
    } else {
      gates = runGates({
        output,
        opportunity,
        briefNotes: brief.notes,
        contentKind: brief.contentKind,
        existingArticles,
      });

      // Gates are ADVISORY in Stage A (see gates.ts header): a failed gate
      // is recorded and shown, but a draft is still created either way,
      // because a human reviews every AI draft before it can go anywhere.
      const id = newId();
      const existingSlugs = new Set(existingArticles.map((a) => a.slug));
      let slug = output.seo.slug || slugify(output.title);
      if (existingSlugs.has(slug)) slug = slugify(`${slug}-${id.slice(0, 6)}`);

      const service = SERVICES.find((s) => s.slug === brief.serviceSlug);
      const viz: VizKind = vizForServiceSlug(brief.serviceSlug);

      await articles.create({
        id,
        slug,
        kind: contentKindToArticleKind(brief.contentKind),
        status: 'draft',
        title: output.title,
        standfirst: output.standfirst,
        excerpt: output.excerpt,
        readingTime: output.readingTime,
        topic: brief.topic,
        featured: false,
        viz,
        vizCaption: output.visual.caption || output.title,
        serviceName: service?.name ?? '',
        serviceSlug: service?.slug ?? '',
        body: output.body,
        // Never mistakeable for approved, real content — same flag and
        // same UI treatment already used for review-only articles.
        isPlaceholder: true,
      });
      articleId = id;
      status = 'succeeded';
    }
  } catch (e) {
    gates = {
      passed: false,
      failures: [{ gate: 'internal', message: e instanceof Error ? e.message : 'שגיאה לא צפויה' }],
    };
  }

  const generation = await aiStores.generations.create({
    opportunityId: opportunity?.id ?? null,
    articleId,
    brief,
    providerMode: provider.mode,
    model,
    promptText,
    output: outputForLog,
    inputTokens,
    outputTokens,
    costUsd,
    status,
    gates,
  });

  if (articleId && outputForLog) {
    await aiStores.assets.create(generation.id, outputForLog.visual);
    await aiStores.assets.attachToArticle(generation.id, articleId);
  }

  if (opportunity) {
    await aiStores.opportunities.setStatus(opportunity.id, 'generated');
  }

  return { generation, articleId };
}
