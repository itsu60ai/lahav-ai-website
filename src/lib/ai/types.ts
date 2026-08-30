// AI content engine shapes. See docs/AI_ENGINE.md for the design.
//
// THE ENGINE IS A DRAFT PRODUCER, NOT A PUBLISHER. Every generation ends as
// a normal Article created through the existing ArticleStore (src/lib/cms).
// Nothing here has its own publishing path, its own storage for articles,
// or its own permissions — it reuses the CMS's for all three.
import type { Article, ArticleKind, Block, VizKind } from '../cms/types.ts';

// ─────────────────────────────────────────────── provider mode

/**
 * mock   — free, no network, deterministic sample output. What Stage A runs.
 * manual — free, the system prints the assembled prompt and a human pastes
 *          the result back from a subscription they already pay for.
 *          (Stage B. Not implemented yet — generate.ts throws if selected.)
 * api    — paid, calls a provider directly. (Stage D. Not implemented yet.)
 *
 * Switching modes is a change to this one setting, not to any other code,
 * because every step downstream of the provider only depends on
 * `TextGenerator`, never on how the text was produced.
 */
export type ProviderMode = 'mock' | 'manual' | 'api';

// ─────────────────────────────────────────────── opportunities (the radar)

export type VerificationState = 'unverified' | 'verified' | 'partial';

/**
 * What kind of piece this becomes. Distinct from the CMS's ArticleKind
 * (guide/hack), which is a tone/length choice made when the article is
 * actually created — see contentKindToArticleKind() in generate.ts.
 */
export type ContentKind = 'hack' | 'release' | 'workflow' | 'comparison' | 'evergreen' | 'trend';

export const CONTENT_KIND_LABELS: Record<ContentKind, string> = {
  hack: 'טיפ פרקטי',
  release: 'עדכון מוצר',
  workflow: 'תהליך עבודה',
  comparison: 'השוואה',
  evergreen: 'תוכן יסוד',
  trend: 'מגמה',
};

export type OpportunityStatus = 'new' | 'generated' | 'dismissed';
export type Priority = 'low' | 'medium' | 'high';

/** One radar find: a real item from a real, named source. */
export interface Opportunity {
  id: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null;
  headline: string;
  summary: string;
  whyItMatters: string;
  suggestedAngle: string;
  contentKind: ContentKind;
  /** matches a SERVICES[].slug in site.ts, or '' if none fits */
  serviceSlug: string;
  verification: VerificationState;
  verificationNote: string;
  freshnessScore: number;
  priority: Priority;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
}

export type OpportunityDraft = Omit<Opportunity, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export interface OpportunityStore {
  list(opts?: { status?: OpportunityStatus }): Promise<Opportunity[]>;
  get(id: string): Promise<Opportunity | null>;
  /** used by the radar collector to avoid re-inserting the same URL */
  urlExists(sourceUrl: string): Promise<boolean>;
  create(d: OpportunityDraft): Promise<Opportunity>;
  setStatus(id: string, status: OpportunityStatus): Promise<Opportunity>;
}

// ─────────────────────────────────────────────── the brief (input to a generation)

export interface Brief {
  topic: string;
  goal: string;
  audience: string;
  contentKind: ContentKind;
  serviceSlug: string;
  /** free-text notes from the admin; also where a manually-noticed trend goes */
  notes: string;
  opportunityId?: string;
}

// ─────────────────────────────────────────────── SEO package

export interface SeoPackage {
  searchIntent: string;
  primaryKeyword: string;
  supportingKeywords: string[];
  seoTitle: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  h2h3Outline: string[];
  internalLinkSlugs: string[];
  serviceSlug: string;
  relatedSlugs: string[];
  citations: { label: string; url: string }[];
  canonicalPath: string;
  indexable: boolean;
}

// ─────────────────────────────────────────────── visuals

export type AssetKind = 'hero' | 'diagram' | 'inline';

export interface VisualAsset {
  id: string;
  kind: AssetKind;
  format: 'svg';
  filename: string;
  altText: string;
  caption: string;
  width: number;
  height: number;
  svgMarkup: string;
  /** mock = template placeholder. generated = came from a real model call (Stage D). */
  source: 'mock' | 'generated';
}

export interface AssetStore {
  create(generationId: string, a: Omit<VisualAsset, 'id'>): Promise<VisualAsset & { id: string }>;
  listByGeneration(generationId: string): Promise<VisualAsset[]>;
  attachToArticle(generationId: string, articleId: string): Promise<void>;
}

// ─────────────────────────────────────────────── the generator interface

/** what a provider (mock, manual, or eventually api) hands back */
export interface GeneratorOutput {
  title: string;
  standfirst: string;
  excerpt: string;
  readingTime: string;
  body: Block[];
  seo: SeoPackage;
  visual: Omit<VisualAsset, 'id'>;
}

export interface GeneratorMeta {
  model: string;
  mode: ProviderMode;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface GeneratorInput {
  brief: Brief;
  opportunity: Opportunity | null;
  /** the fully assembled prompt text, built by prompt.ts — style guide +
   *  truth rules + learned rules + examples + the brief, in that order */
  promptText: string;
}

/**
 * The only interface the rest of the engine depends on. generate.ts is the
 * one file that picks an implementation; nothing else needs to know
 * whether the text came from a template, a pasted reply, or a live API.
 */
export interface TextGenerator {
  readonly mode: ProviderMode;
  generate(input: GeneratorInput): Promise<{ output: GeneratorOutput; meta: GeneratorMeta }>;
}

// ─────────────────────────────────────────────── gates

/**
 * blocking — a real problem; publishing from this review page is withheld
 *   until it's resolved (a genuine duplicate, unusable content).
 * review — worth a human look before publishing, not withheld (an
 *   unverified number, a related-but-different existing article, SEO gaps).
 * info — minor, background-shown, never blocks anything.
 */
export type GateSeverity = 'blocking' | 'review' | 'info';

export interface GateFailure {
  /** internal id (e.g. "invented-numbers") — kept for logs/debugging, never shown as the primary label */
  gate: string;
  severity: GateSeverity;
  /** short Hebrew headline, e.g. "נמצא מספר שדורש אימות" */
  title: string;
  /** the fuller explanation of why this was flagged */
  detail: string;
  /** the exact sentence/number/field this is about, quoted verbatim */
  evidence?: string;
  /** where in the article, e.g. "בגוף הכתבה", "בכותרת ה-SEO" */
  location?: string;
  /** what to actually do about it, in plain Hebrew */
  suggestion?: string;
  meta?: {
    matchedArticleId?: string;
    matchedArticleSlug?: string;
    matchedArticleTitle?: string;
    matchedNumber?: string;
    sourceUrl?: string;
    sourceChecked?: string;
  };
}

export interface GateResult {
  /** true only when there are zero BLOCKING failures — review/info items don't count against this */
  passed: boolean;
  failures: GateFailure[];
}

// ─────────────────────────────────────────────── generation history

export type GenerationStatus = 'pending' | 'succeeded' | 'failed';

export interface Generation {
  id: string;
  opportunityId: string | null;
  articleId: string | null;
  brief: Brief;
  providerMode: ProviderMode;
  model: string;
  promptText: string;
  output: GeneratorOutput | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  status: GenerationStatus;
  gates: GateResult;
  createdAt: string;
}

export interface GenerationStore {
  list(): Promise<Generation[]>;
  get(id: string): Promise<Generation | null>;
  create(g: Omit<Generation, 'id' | 'createdAt'>): Promise<Generation>;
  /**
   * Stage B needs this: a manual generation is created once, as `pending`,
   * the moment the prompt is prepared — then updated in place once the
   * pasted-back result is parsed. Nothing about this write path lets a
   * generation publish anything; it only ever touches this one row.
   */
  update(
    id: string,
    patch: Partial<Pick<Generation, 'articleId' | 'output' | 'inputTokens' | 'outputTokens' | 'costUsd' | 'status' | 'gates'>>
  ): Promise<Generation>;
}

// ─────────────────────────────────────────────── learning

export type FeedbackKind = 'approve' | 'reject' | 'edit';

export interface Feedback {
  id: string;
  generationId: string;
  articleId: string | null;
  kind: FeedbackKind;
  field: string;
  beforeText: string;
  afterText: string;
  note: string;
  createdAt: string;
}

export interface FeedbackStore {
  create(f: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback>;
  listByGeneration(generationId: string): Promise<Feedback[]>;
  listRecent(limit: number): Promise<Feedback[]>;
}

/** one entry in the readable, admin-editable learned rule list */
export interface Rule {
  id: string;
  ruleText: string;
  sourceCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RuleStore {
  listActive(): Promise<Rule[]>;
  upsertByText(ruleText: string): Promise<Rule>;
  setActive(id: string, active: boolean): Promise<void>;
}

// ─────────────────────────────────────────────── recommendations ("what to write today")

/**
 * heuristic — free, real math over real stored data (recency, source
 *   trust, service match, related-item clustering). Runs automatically,
 *   no button, no network call. What is live today.
 * api — a real model reads the opportunities and writes genuine judgment
 *   (why this matters, the business angle, connecting related items in a
 *   way a formula can't). NOT IMPLEMENTED — pickRecommender() in
 *   recommend/index.ts throws if this is selected. Wired so turning it on
 *   later is a settings change, not a rebuild.
 */
export type RecommendationMode = 'heuristic' | 'api';

export interface RecommendationPick {
  opportunityId: string;
  rank: number;
  headline: string;
  /** why this, why now — built only from real fields in heuristic mode */
  reason: string;
  /** the LAHAV AI business angle */
  angle: string;
  relatedOpportunityIds: string[];
  score: number;
}

export interface RecommendationRun {
  id: string;
  mode: RecommendationMode;
  model: string;
  costUsd: number;
  picks: RecommendationPick[];
  createdAt: string;
}

export interface RecommendationStore {
  /** most recent run, or null if none exists or the newest is older than maxAgeMs */
  latest(maxAgeMs: number): Promise<RecommendationRun | null>;
  create(r: Omit<RecommendationRun, 'id' | 'createdAt'>): Promise<RecommendationRun>;
}

/**
 * The interface a recommender implements — mirrors TextGenerator on
 * purpose, same reasoning: generate.ts and recommend/index.ts are the only
 * two files that know which provider is active.
 */
export interface Recommender {
  readonly mode: RecommendationMode;
  recommend(opportunities: Opportunity[]): Promise<{
    picks: Omit<RecommendationPick, 'rank'>[];
    model: string;
    costUsd: number;
  }>;
}

// ─────────────────────────────────────────────── settings (auto publish)

export interface AiSettings {
  providerMode: ProviderMode;
  recommendationMode: RecommendationMode;
  /** off by default — the AI-disclosure line is a capability, not a forced
   *  insertion. See docs/AI_ENGINE.md, client feedback 2026-09-01. */
  disclosureEnabled: boolean;
  autoPublishEnabled: boolean;
  autoPublishExpiresAt: string | null;
  autoPublishWeeklyCap: number;
  autoPublishWeekStart: string | null;
  autoPublishCountThisWeek: number;
  updatedAt: string;
  updatedBy: string;
}

/**
 * READ ONLY, deliberately. There is no `SettingsStore.enableAutoPublish()`
 * anywhere in this file or in d1.ts. The capability to turn Auto Publish on
 * does not exist in code the engine can reach — see docs/AI_ENGINE.md
 * section 12, layer 2. When Auto Publish is built (Stage D), its one writer
 * lives in an admin-only route gated on `settings:manage`, never here.
 */
export interface SettingsStore {
  get(): Promise<AiSettings>;
}

// ─────────────────────────────────────────────── everything a request needs

export interface AiStores {
  opportunities: OpportunityStore;
  generations: GenerationStore;
  feedback: FeedbackStore;
  rules: RuleStore;
  settings: SettingsStore;
  assets: AssetStore;
  recommendations: RecommendationStore;
}

export type { Article, ArticleKind, Block, VizKind };
