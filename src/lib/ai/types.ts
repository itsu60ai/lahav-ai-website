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
/** Where an item comes from. Two values because only two are true here:
 *  Israeli/Hebrew sources, and everything else. Derived at collection time
 *  from the source plus a Hebrew-script check, never guessed later. */
export type OpportunityRegion = 'il' | 'intl';

export const REGION_LABELS: Record<OpportunityRegion, string> = {
  il: 'ישראל',
  intl: 'בינלאומי',
};

export interface Opportunity {
  id: string;
  region: OpportunityRegion;
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
  /**
   * Stage C, the free fallback for verification (docs/AI_ENGINE.md 3.4):
   * the name/email of the person who opened the source link and confirmed
   * the claim. Empty means nobody has. A machine never writes these.
   */
  verifiedBy: string;
  verifiedAt: string | null;
  freshnessScore: number;
  priority: Priority;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
}

export type OpportunityDraft = Omit<
  Opportunity,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'verifiedBy' | 'verifiedAt'
>;

export interface OpportunityStore {
  list(opts?: { status?: OpportunityStatus }): Promise<Opportunity[]>;
  get(id: string): Promise<Opportunity | null>;
  /** used by the radar collector to avoid re-inserting the same URL */
  urlExists(sourceUrl: string): Promise<boolean>;
  create(d: OpportunityDraft): Promise<Opportunity>;
  setStatus(id: string, status: OpportunityStatus): Promise<Opportunity>;
  /**
   * Records a HUMAN verification. `verifiedBy` is required and is never
   * an empty string in practice, because the only caller is an
   * authenticated admin route that passes the signed-in user.
   */
  setVerification(
    id: string,
    v: { verification: VerificationState; note: string; verifiedBy: string }
  ): Promise<Opportunity>;
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
  /**
   * The admin did not have a topic in mind and asked the engine to choose
   * one. Set by buildBriefFromForm only when the radar had nothing fresh to
   * hand over; when it did, that opportunity becomes the brief instead and
   * this stays false. Without this flag, typing "תחשוב לבד" into the topic
   * box produced an article whose subject was, literally, "think of one
   * yourself" — the model has no way to tell an instruction from a topic.
   */
  autoTopic?: boolean;
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
  /** Stage C: the public /api/og/<slug>.svg route resolves by article. */
  listByArticle(articleId: string): Promise<VisualAsset[]>;
  attachToArticle(generationId: string, articleId: string): Promise<void>;
}

// ─────────────────────────────────────────────── the generator interface

/** what a provider (mock, manual, or eventually api) hands back */
export interface GeneratorOutput {
  /**
   * Photographs to generate for this article, in order. Empty when the
   * writer asked for none. `description` is the English scene fed to the
   * image model; `alt` is the writer's own Hebrew line describing what is
   * actually in that specific photo — used as the img block's alt text,
   * instead of a generic "same as the article title" fallback that told a
   * screen reader nothing about the photo itself.
   */
  photoPrompts?: { description: string; alt: string }[];
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
  /** set the instant /api/admin/ai/run actually starts calling the
   *  provider, null otherwise. Exists to stop a reopened tab or a second
   *  request from re-running (and re-billing) a paid generation that is
   *  already in flight -- see the header comment on run.ts. */
  runStartedAt: string | null;
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
  create(g: Omit<Generation, 'id' | 'createdAt' | 'runStartedAt'>): Promise<Generation>;
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
  /**
   * Claims the run lock: sets run_started_at ONLY if it is currently null,
   * atomically, and reports whether this call was the one that set it. Two
   * requests racing to run the same generation can both call this; exactly
   * one gets claimed=true.
   */
  claimRun(id: string): Promise<{ claimed: boolean; runStartedAt: string | null }>;
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
  /** Stage C: the editable rule screen shows inactive rules too. */
  listAll(): Promise<Rule[]>;
  get(id: string): Promise<Rule | null>;
  upsertByText(ruleText: string): Promise<Rule>;
  setActive(id: string, active: boolean): Promise<void>;
  /** Stage C: the admin rewrote a rule in their own words. */
  updateText(id: string, ruleText: string): Promise<void>;
  /** Stage C: a rule that is simply wrong gets removed, not hidden. */
  remove(id: string): Promise<void>;
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
  autoPublishArmedBy: string;
  autoPublishArmedAt: string | null;
  autoPublishNotifyEmail: string;
  autoPublishKilledAt: string | null;
  autoPublishKilledBy: string;
  updatedAt: string;
  updatedBy: string;
}

/** The engine-mode settings a `settings:manage` admin may change freely. */
export interface EngineSettingsPatch {
  providerMode?: ProviderMode;
  recommendationMode?: RecommendationMode;
  disclosureEnabled?: boolean;
  autoPublishWeeklyCap?: number;
  autoPublishNotifyEmail?: string;
}

/**
 * The ONE shape that can turn auto publish on, and the reason it looks
 * like this.
 *
 * docs/AI_ENGINE.md section 12, layer 2: auto publish must be structurally
 * unable to enable itself. That is enforced by three things together:
 *
 *  1. `armedBy` is a REQUIRED, non-optional string. Every caller must name
 *     a human. There is no default and no "system" value.
 *  2. `expiresAt` is REQUIRED. There is no way to express "on forever";
 *     the arming call must state a date on which it switches itself off.
 *  3. `arm()` is only ever called from ONE file:
 *     src/pages/api/admin/ai/auto-publish.ts, which is behind the admin
 *     session, CSRF, `settings:manage`, and a typed confirmation phrase.
 *     Nothing in src/lib/ai/* imports it. The scheduled job (autopublish.ts)
 *     imports `get()` and `recordAutoPublish()` and nothing else, so the
 *     unattended path can read the switch and can never flip it.
 */
export interface ArmAutoPublishInput {
  expiresAt: string;
  weeklyCap: number;
  armedBy: string;
}

export interface SettingsStore {
  get(): Promise<AiSettings>;
  /** Stage D: engine mode switches. Records updated_by and updated_at. */
  update(patch: EngineSettingsPatch, updatedBy: string): Promise<AiSettings>;
  /** See ArmAutoPublishInput. The only way auto_publish_enabled becomes 1. */
  arm(input: ArmAutoPublishInput): Promise<AiSettings>;
  /**
   * Turns auto publish off. Safe to call from anywhere, including the
   * unattended job (expiry enforcement) and the kill switch, because
   * turning a dangerous thing OFF never needs to be guarded.
   */
  disarm(by: string, killed: boolean): Promise<AiSettings>;
  /** Weekly cap bookkeeping. Rolls the window when the week has changed. */
  recordAutoPublishUse(weekStart: string, count: number): Promise<void>;
}

// ─────────────────────────────────────────────── auto publish allow list + audit

export interface AllowlistTopic {
  id: string;
  topic: string;
  createdAt: string;
  createdBy: string;
}

export interface TopicAllowlistStore {
  list(): Promise<AllowlistTopic[]>;
  add(topic: string, createdBy: string): Promise<void>;
  remove(id: string): Promise<void>;
}

/** One row per article that reached the public site without a human click. */
export interface AutoPublication {
  id: string;
  articleId: string;
  generationId: string;
  articleTitle: string;
  articleSlug: string;
  publishedAt: string;
  armedBy: string;
  unpublishToken: string;
  unpublishedAt: string | null;
  unpublishedBy: string;
  notified: boolean;
  notifyError: string;
}

export interface AutoPublicationStore {
  create(
    p: Omit<AutoPublication, 'id' | 'unpublishedAt' | 'unpublishedBy' | 'notified' | 'notifyError'>
  ): Promise<AutoPublication>;
  listRecent(limit: number): Promise<AutoPublication[]>;
  /** everything auto published in the last N days and not already reverted */
  listSince(isoDate: string): Promise<AutoPublication[]>;
  byToken(token: string): Promise<AutoPublication | null>;
  markUnpublished(id: string, by: string): Promise<void>;
  markNotified(id: string, error: string): Promise<void>;
}

/**
 * A radar source the admin added themselves, on top of the built-in feed
 * list in radar/feeds.ts. Same shape as FeedSource, but stored so it can
 * be added and removed from the admin screen with no code change. Only a
 * real RSS/Atom feed URL, verified by a live fetch when it is added — a
 * plain topic phrase with no feed cannot be "scanned" for free, so the
 * add form only accepts a URL (docs/AI_ENGINE.md section 4's honesty
 * rule: no fake scraper, no invented result).
 */
export interface RadarSource {
  id: string;
  name: string;
  url: string;
  topic: string;
  active: boolean;
  createdAt: string;
}

export interface RadarSourceStore {
  listActive(): Promise<RadarSource[]>;
  listAll(): Promise<RadarSource[]>;
  add(input: { name: string; url: string; topic: string }): Promise<RadarSource>;
  setActive(id: string, active: boolean): Promise<void>;
  remove(id: string): Promise<void>;
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
  allowlist: TopicAllowlistStore;
  autoPublications: AutoPublicationStore;
  radarSources: RadarSourceStore;
}

export type { Article, ArticleKind, Block, VizKind };
