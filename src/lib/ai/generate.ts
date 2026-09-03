// The orchestrator. THIS IS THE ONE PLACE THAT TIES A PROVIDER TO THE CMS.
//
// The flow matches docs/AI_ENGINE.md section 2 exactly: assemble the
// prompt, call the provider, validate, gate, then create a normal draft
// through the EXISTING ArticleStore — the same one the manual editor uses.
// This function never sets an article's status to "published"; it always
// creates a draft.
//
// TWO-PHASE, and why (2026-09-03):
// Writing an article takes minutes. Cloudflare cuts off a browser request
// that waits that long, so the old single-shot version could never finish:
// every production attempt died as a 524 and the user just watched a
// spinner. Generation is now split so the browser never waits for a model:
//
//   beginGeneration()    creates the row the user watches, instantly.
//   completeGeneration() does the slow work and patches that same row.
//
// The API route returns as soon as beginGeneration resolves and hands
// completeGeneration to waitUntil(), so the work continues after the
// response is sent. This is the same create-pending-then-patch shape the
// manual paste flow has always used, so the data model needed no change.
import { newId, slugify } from '../cms/context.ts';
import type { ArticleStore, VizKind } from '../cms/types.ts';
import { SERVICES } from '../site.ts';
import { assemblePrompt } from './prompt.ts';
import { runGates } from './gates.ts';
import { contentKindToArticleKind, vizForServiceSlug } from './mapping.ts';
import { apiGenerator } from './providers/api.ts';
import { mockGenerator } from './providers/mock.ts';
import { validateGeneratorOutput } from './validate.ts';
import type { AiStores, Brief, GateResult, Generation, TextGenerator } from './types.ts';

function internalFailure(message: string): GateResult {
  return {
    passed: false,
    failures: [{ gate: 'internal', severity: 'blocking', title: 'שגיאה פנימית', detail: message }],
  };
}

function pickProvider(mode: string): TextGenerator {
  if (mode === 'mock') return mockGenerator;
  // Stage D: the paid provider. Reached only when a `settings:manage`
  // admin has set provider_mode to 'api'; the column defaults to 'mock'.
  if (mode === 'api') return apiGenerator;
  // MANUAL keeps its own separate two-step route (manual-prepare, then the
  // paste-back screen at /admin/ai/manual/[id]) because it needs a human
  // in the middle. It never runs through this one-shot path, so reaching
  // here in manual mode means the wrong button was wired, and saying so is
  // more useful than silently producing a mock draft.
  if (mode === 'manual') {
    throw new Error(
      'מצב "הדבקה ידנית" עובד במסלול נפרד: לחצו "כתיבת מאמר אמיתי" כדי לקבל את הבקשה להדבקה.'
    );
  }
  // Failing loudly is the point: a setting that silently fell back to mock
  // would hide a real gap.
  throw new Error(`מצב ספק "${mode}" אינו מוכר. ראו docs/AI_ENGINE.md.`);
}

export interface GenerateArgs {
  brief: Brief;
  aiStores: AiStores;
  articles: ArticleStore;
  /**
   * Overrides ai_settings.provider_mode for this one generation. The free
   * "טיוטת בדיקה" button passes 'mock' so that a button labelled as a free
   * test is always actually free, whatever the saved mode happens to be.
   */
  forceMode?: string;
}

export interface GenerateResult {
  generation: Generation;
  articleId: string | null;
}

/**
 * Phase one: create the row the user will watch. Cheap and fast — it
 * assembles the prompt and writes one D1 row, and calls no model. The
 * caller can return a redirect the moment this resolves.
 */
export async function beginGeneration(args: GenerateArgs): Promise<Generation> {
  const { brief, aiStores, articles } = args;

  const opportunity = brief.opportunityId ? await aiStores.opportunities.get(brief.opportunityId) : null;
  const settings = await aiStores.settings.get();
  const mode = args.forceMode ?? settings.providerMode;
  // Validate the mode now, while the user is still watching a request, so an
  // unusable setting fails immediately instead of in a background task.
  const provider = pickProvider(mode);

  const [existingArticles, rules] = await Promise.all([articles.list(), aiStores.rules.listActive()]);
  const examples = existingArticles.filter((a) => a.status === 'published' && !a.isPlaceholder);
  const promptText = assemblePrompt({ brief, opportunity, examples, rules });

  return aiStores.generations.create({
    opportunityId: opportunity?.id ?? null,
    articleId: null,
    brief,
    providerMode: provider.mode,
    model: provider.mode,
    promptText,
    output: null,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    status: 'pending',
    gates: { passed: false, failures: [] },
  });
}

/**
 * Phase two: the slow part. Calls the provider, validates, gates, creates
 * the draft article, and patches the generation row created by
 * beginGeneration. Never throws — a failure is recorded ON the row, which
 * is what the review screen reads, so the user always has something to
 * look at instead of a dead spinner.
 */
export async function completeGeneration(generationId: string, args: GenerateArgs): Promise<void> {
  const { aiStores, articles } = args;

  const generation = await aiStores.generations.get(generationId);
  if (!generation) return;

  const brief = generation.brief;
  const opportunity = generation.opportunityId
    ? await aiStores.opportunities.get(generation.opportunityId)
    : null;

  let articleId: string | null = null;
  let status: 'succeeded' | 'failed' = 'failed';
  let outputForLog = null as Generation['output'];
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;
  let gates = internalFailure('לא הושלם');

  try {
    const provider = pickProvider(generation.providerMode);
    const existingArticles = await articles.list();

    const { output, meta } = await provider.generate({
      brief,
      opportunity,
      promptText: generation.promptText,
    });
    outputForLog = output;
    inputTokens = meta.inputTokens;
    outputTokens = meta.outputTokens;
    costUsd = meta.costUsd;

    const validation = validateGeneratorOutput(output);
    if (!validation.ok) {
      gates = {
        passed: false,
        failures: validation.errors.map((message) => ({
          gate: 'validation',
          severity: 'blocking' as const,
          title: 'התוצר לא תקין',
          detail: message,
        })),
      };
    } else {
      gates = runGates({
        output,
        opportunity,
        briefNotes: brief.notes,
        contentKind: brief.contentKind,
        existingArticles,
      });

      // Gates are ADVISORY (see gates.ts header): a failed gate is recorded
      // and shown, but a draft is still created either way, because a human
      // reviews every AI draft before it can go anywhere.
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
    gates = internalFailure(e instanceof Error ? e.message : 'שגיאה לא צפויה');
  }

  await aiStores.generations.update(generationId, {
    articleId,
    output: outputForLog,
    inputTokens,
    outputTokens,
    costUsd,
    status,
    gates,
  });

  if (articleId && outputForLog) {
    await aiStores.assets.create(generationId, outputForLog.visual);
    await aiStores.assets.attachToArticle(generationId, articleId);
  }

  // ONLY on success. The old code ran this unconditionally, so a failed
  // generation still marked the idea "used" and it disappeared from the
  // list for good — the user lost the idea AND got no article. A failure
  // now leaves the opportunity exactly where it was, ready to retry.
  if (opportunity && status === 'succeeded') {
    await aiStores.opportunities.setStatus(opportunity.id, 'generated');
  }
}

/**
 * Both phases, back to back. Used by callers that are not serving a browser
 * request and can afford to wait: the scheduled job, and the free mock
 * generator (which returns instantly and never touches the network).
 */
export async function generateDraft(args: GenerateArgs): Promise<GenerateResult> {
  const started = await beginGeneration(args);
  await completeGeneration(started.id, args);
  const generation = (await args.aiStores.generations.get(started.id)) ?? started;
  return { generation, articleId: generation.articleId };
}
