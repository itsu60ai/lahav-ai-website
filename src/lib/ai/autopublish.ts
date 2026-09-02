// Stage D, D3 + D4: the unattended run, and every auto publish safety
// layer from docs/AI_ENGINE.md section 12 / SOURCE_OF_TRUTH H.3.3.
//
// ─────────────────────────────────────────────────────────────────────
// THE ELEVEN LAYERS, and where each one actually lives
// ─────────────────────────────────────────────────────────────────────
//  1. Ships OFF                  migration 0004 defaults auto_publish_enabled
//                                to 0; migration 0015 adds nothing that
//                                turns it on; the allow list ships EMPTY,
//                                which independently blocks everything.
//  2. Cannot enable itself       THIS FILE NEVER IMPORTS settings.arm().
//                                It imports get(), disarm() and
//                                recordAutoPublishUse() only. The machine
//                                can switch itself off and can never switch
//                                itself on. See guardAutoPublish() below
//                                and the comment on SettingsStore.arm().
//  3. settings:manage only       enforced in the admin route
//                                src/pages/api/admin/ai/auto-publish.ts
//  4. Typed confirmation         same route: the admin must type an exact
//                                Hebrew phrase before arming.
//  5. Automatic expiry           enforced HERE, first, in guardAutoPublish:
//                                an expired arming disarms itself on the
//                                next run and publishes nothing.
//  6. Hard weekly cap            enforced HERE, in guardAutoPublish, with
//                                the week window rolled on read.
//  7. Topic allow list           enforced HERE, in pickAllowedOpportunity.
//                                An empty list allows nothing.
//  8. Gates must pass            enforced HERE, in tryAutoPublish. Any
//                                blocking OR review failure means the
//                                article stays a draft. It is never
//                                published and never discarded.
//  9. Email on every publish     sendAutoPublishEmail, called on success.
// 10. One click unpublish        the token in that email, redeemed at
//                                src/pages/api/ai-unpublish.ts
// 11. Full audit trail           ai_auto_publications, written before the
//                                email is even attempted.
import type { ArticleStore } from '../cms/types.ts';
import { collectOpportunities } from './radar/collect.ts';
import { getOrComputeRecommendation } from './recommend/index.ts';
import { generateDraft } from './generate.ts';
import { sendAutoPublishEmail } from './notify.ts';
import { buildBriefFromOpportunity } from './brief.ts';
import { weekStartOf } from './d1.ts';
import type { AiStores, AutoPublication, Opportunity } from './types.ts';

export interface ScheduledRunArgs {
  aiStores: AiStores;
  articles: ArticleStore;
  resendApiKey: string | undefined;
  siteOrigin: string;
}

export interface ScheduledRunReport {
  collected: number;
  recommended: number;
  autoPublishConsidered: boolean;
  /** plain Hebrew, safe to show in the admin and to log */
  outcome: string;
  generationId: string | null;
  articleId: string | null;
  published: boolean;
}

/** How far back the kill switch reaches by default. */
export const KILL_SWITCH_DEFAULT_DAYS = 7;

// ─────────────────────────────────────────────── the guard

interface GuardResult {
  allowed: boolean;
  reason: string;
  /** the week window to record against, once a publish actually happens */
  weekStart: string;
  countThisWeek: number;
}

/**
 * Every gate that must be open BEFORE a single token is spent on an
 * unattended generation. Ordered cheapest and most decisive first.
 *
 * Note what this function can do to the settings row: it can only ever
 * call disarm(). There is no code path from here to arm().
 */
async function guardAutoPublish(stores: AiStores): Promise<GuardResult> {
  const s = await stores.settings.get();
  const nowWeek = weekStartOf(new Date());

  if (!s.autoPublishEnabled) {
    return { allowed: false, reason: 'פרסום אוטומטי כבוי.', weekStart: nowWeek, countThisWeek: 0 };
  }

  // LAYER 5: automatic expiry. An arming without an expiry is treated as
  // not armed at all, and an expired one turns itself off here rather than
  // waiting for somebody to notice.
  if (!s.autoPublishExpiresAt || new Date(s.autoPublishExpiresAt).getTime() <= Date.now()) {
    await stores.settings.disarm('פג תוקף אוטומטי', false);
    return {
      allowed: false,
      reason: 'תוקף ההפעלה של הפרסום האוטומטי פג, והמערכת כיבתה אותו בעצמה. כדי להמשיך, יש להפעיל מחדש ידנית.',
      weekStart: nowWeek,
      countThisWeek: 0,
    };
  }

  // LAYER 6: the hard weekly cap. A new week resets the counter; the cap
  // itself is never raised by this code.
  const sameWeek = s.autoPublishWeekStart === nowWeek;
  const countThisWeek = sameWeek ? s.autoPublishCountThisWeek : 0;
  if (s.autoPublishWeeklyCap < 1) {
    return { allowed: false, reason: 'המכסה השבועית היא אפס, ולכן לא יפורסם דבר.', weekStart: nowWeek, countThisWeek };
  }
  if (countThisWeek >= s.autoPublishWeeklyCap) {
    return {
      allowed: false,
      reason: `נוצלה המכסה השבועית (${s.autoPublishWeeklyCap} מאמרים). לא יפורסם דבר עד תחילת השבוע הבא.`,
      weekStart: nowWeek,
      countThisWeek,
    };
  }

  // Unattended generation requires a provider that can run without a
  // person. Mock output must never reach the public site, and manual mode
  // needs a human to paste.
  if (s.providerMode !== 'api') {
    return {
      allowed: false,
      reason: 'פרסום אוטומטי דורש מצב ספק "API". במצב בדיקה או הדבקה ידנית לא ניתן לכתוב ולפרסם ללא אדם.',
      weekStart: nowWeek,
      countThisWeek,
    };
  }

  return { allowed: true, reason: '', weekStart: nowWeek, countThisWeek };
}

// ─────────────────────────────────────────────── LAYER 7: the allow list

/**
 * An opportunity qualifies only if it matches an entry the admin typed.
 * An EMPTY allow list matches nothing, which is why auto publish is inert
 * on a fresh database even if every other switch were somehow flipped.
 */
export function matchesAllowlist(o: Opportunity, topics: string[]): boolean {
  if (topics.length === 0) return false;
  const haystack = [o.headline, o.summary, o.suggestedAngle, o.serviceSlug, o.contentKind]
    .join(' ')
    .toLowerCase();
  return topics.some((t) => t && haystack.includes(t));
}

async function pickAllowedOpportunity(
  stores: AiStores,
  orderedIds: string[]
): Promise<{ opportunity: Opportunity | null; reason: string }> {
  const [allowRows, open] = await Promise.all([
    stores.allowlist.list(),
    stores.opportunities.list({ status: 'new' }),
  ]);
  const topics = allowRows.map((r) => r.topic.trim().toLowerCase()).filter(Boolean);
  if (topics.length === 0) {
    return {
      opportunity: null,
      reason: 'רשימת הנושאים המאושרים ריקה, ולכן אין נושא שמותר לפרסם עליו אוטומטית.',
    };
  }

  const byId = new Map(open.map((o) => [o.id, o]));
  // Prefer the recommender's own ranking, then fall back to the rest of
  // the open list in the order the radar ranked it.
  const ordered = [...orderedIds.map((id) => byId.get(id)).filter((o): o is Opportunity => !!o), ...open];
  const seen = new Set<string>();

  for (const o of ordered) {
    if (seen.has(o.id)) continue;
    seen.add(o.id);
    if (!matchesAllowlist(o, topics)) continue;
    // An unattended publish of an unverified claim is exactly what the
    // fact gate exists to prevent, so it is refused before generation
    // rather than caught afterwards.
    if (o.verification !== 'verified' || !o.verifiedBy) continue;
    return { opportunity: o, reason: '' };
  }

  return {
    opportunity: null,
    reason:
      'לא נמצאה הזדמנות שגם מתאימה לרשימת הנושאים המאושרים וגם אומתה על ידי אדם. לא נוצרה כתבה.',
  };
}

// ─────────────────────────────────────────────── the run

export async function runScheduledJob(args: ScheduledRunArgs): Promise<ScheduledRunReport> {
  const { aiStores, articles } = args;

  // STEP 1: collect the radar. Free, no model call, runs on every schedule
  // regardless of whether auto publish is armed.
  const collected = await collectOpportunities(aiStores);
  const collectedCount = collected.created;

  // STEP 2: compute the recommendations. Free in heuristic mode, which is
  // the default and stays the default.
  const recommendation = await getOrComputeRecommendation(aiStores);
  const picks = recommendation?.picks ?? [];

  const base: ScheduledRunReport = {
    collected: collectedCount,
    recommended: picks.length,
    autoPublishConsidered: false,
    outcome: '',
    generationId: null,
    articleId: null,
    published: false,
  };

  // STEP 3: auto publish, only if every layer above says yes.
  const guard = await guardAutoPublish(aiStores);
  if (!guard.allowed) {
    return { ...base, outcome: `איסוף והמלצות הושלמו. ${guard.reason}` };
  }

  const { opportunity, reason } = await pickAllowedOpportunity(
    aiStores,
    picks.map((p) => p.opportunityId)
  );
  if (!opportunity) {
    return { ...base, autoPublishConsidered: true, outcome: `איסוף והמלצות הושלמו. ${reason}` };
  }

  return tryAutoPublish({ ...args, base, opportunity, guard });
}

async function tryAutoPublish(args: {
  aiStores: AiStores;
  articles: ArticleStore;
  resendApiKey: string | undefined;
  siteOrigin: string;
  base: ScheduledRunReport;
  opportunity: Opportunity;
  guard: GuardResult;
}): Promise<ScheduledRunReport> {
  const { aiStores, articles, base, opportunity, guard } = args;

  const brief = buildBriefFromOpportunity(opportunity);

  // ONE draft. generateDraft is the same function the admin's own button
  // calls: same provider, same validation, same gates, same ArticleStore.
  // There is no second, looser path to an article.
  const { generation, articleId } = await generateDraft({ brief, aiStores, articles });

  const report: ScheduledRunReport = {
    ...base,
    autoPublishConsidered: true,
    generationId: generation.id,
    articleId,
  };

  if (generation.status !== 'succeeded' || !articleId) {
    const detail = generation.gates.failures.map((f) => f.title).join('; ');
    return {
      ...report,
      outcome: `היצירה נכשלה ולכן לא פורסם דבר. ${detail}`.trim(),
    };
  }

  // LAYER 8: the gates. For an UNATTENDED publish the bar is higher than
  // for a human-reviewed draft: a "review" flag exists precisely because
  // somebody should look at it, and in this path nobody will. So anything
  // above "info" keeps the article a draft.
  //
  // A failed gate saves a draft and notifies. It never publishes and never
  // silently discards. The draft is already saved at this point, in the
  // normal CMS, exactly where the admin will find it.
  const blocking = generation.gates.failures.filter((f) => f.severity !== 'info');
  if (blocking.length > 0) {
    return {
      ...report,
      outcome:
        `נוצרה טיוטה, אך היא לא פורסמה כי בדיקות האיכות סימנו ${blocking.length} נקודות שדורשות אדם: ` +
        `${blocking.map((f) => f.title).join('; ')}. הטיוטה ממתינה לכם במערכת התוכן.`,
    };
  }

  // Everything passed. Publish, and record it as an auto publish.
  const settings = await aiStores.settings.get();

  // A generated draft is created with isPlaceholder = true (it is sample
  // content until something says otherwise). An article that genuinely
  // passed every gate and is going live must not carry the "sample
  // content" banner or the noindex that comes with it.
  await articles.update(articleId, { isPlaceholder: false });
  const article = await articles.setStatus(articleId, 'published');

  // LAYER 11: the audit row, written BEFORE the email is attempted, so a
  // mail failure can never lose the record of what went live.
  const publication = await aiStores.autoPublications.create({
    articleId,
    generationId: generation.id,
    articleTitle: article.title,
    articleSlug: article.slug,
    publishedAt: article.publishedAt ?? new Date().toISOString(),
    armedBy: settings.autoPublishArmedBy,
    unpublishToken: crypto.randomUUID().replace(/-/g, ''),
  });

  // LAYER 6, the other half: the cap counter only moves on a real publish.
  await aiStores.settings.recordAutoPublishUse(guard.weekStart, guard.countThisWeek + 1);

  // LAYER 9: notify, every time, with the one click unpublish link.
  const mail = await sendAutoPublishEmail({
    apiKey: args.resendApiKey,
    to: settings.autoPublishNotifyEmail,
    siteOrigin: args.siteOrigin,
    publication,
  });
  await aiStores.autoPublications.markNotified(publication.id, mail.error ?? '');

  return {
    ...report,
    published: true,
    outcome:
      `המאמר "${article.title}" עבר את כל הבדיקות ופורסם אוטומטית. ` +
      (mail.sent ? 'נשלחה הודעת אימייל עם קישור להסרה מיידית.' : `שליחת האימייל נכשלה: ${mail.error}`),
  };
}

// ─────────────────────────────────────────────── the kill switch

export interface KillSwitchResult {
  disarmed: boolean;
  unpublished: AutoPublication[];
}

/**
 * ONE action: turn auto publish off AND take back everything it published
 * in the last `days` days.
 *
 * Reverting means returning the article to `draft`, not deleting it. The
 * content is never destroyed, only removed from public view, which is the
 * correct behaviour for a panic button: it must be safe to press.
 */
export async function killAutoPublish(args: {
  aiStores: AiStores;
  articles: ArticleStore;
  by: string;
  days?: number;
}): Promise<KillSwitchResult> {
  const { aiStores, articles, by } = args;
  const days = args.days ?? KILL_SWITCH_DEFAULT_DAYS;

  await aiStores.settings.disarm(by, true);

  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const recent = await aiStores.autoPublications.listSince(since);

  const reverted: AutoPublication[] = [];
  for (const p of recent) {
    const article = await articles.get(p.articleId);
    if (!article || article.status !== 'published') continue;
    await articles.setStatus(p.articleId, 'draft');
    await aiStores.autoPublications.markUnpublished(p.id, by);
    reverted.push(p);
  }

  return { disarmed: true, unpublished: reverted };
}
