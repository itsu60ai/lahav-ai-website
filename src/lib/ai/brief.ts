// Builds a Brief from a submitted form, either from a picked opportunity
// or from fields typed by hand. Shared by the mock-generate route and the
// manual (Stage B) prepare route, so both interpret the same form shape
// identically — one definition of "what a brief is," not two that could drift.
import type { AiStores, Brief, ContentKind, Opportunity } from './types.ts';

const VALID_KINDS: ContentKind[] = ['hack', 'release', 'workflow', 'comparison', 'evergreen', 'trend'];

/**
 * The one definition of "what a brief built from a radar item is".
 *
 * Shared by the admin's own buttons (through buildBriefFromForm below) and
 * by the unattended scheduled run (autopublish.ts), so the article the
 * machine writes at 3am is briefed identically to the one a person asks
 * for at noon. There is no separate, looser brief for the automated path.
 */
export function buildBriefFromOpportunity(opp: Opportunity): Brief {
  return {
    topic: opp.headline,
    goal: opp.whyItMatters,
    audience: 'בעלי עסקים קטנים בישראל',
    contentKind: opp.contentKind,
    serviceSlug: opp.serviceSlug,
    notes: opp.suggestedAngle,
    opportunityId: opp.id,
  };
}

/**
 * Phrases people type into the topic box when they mean "you pick," not
 * when they mean "write about this." Matched whole-field only: a real
 * article could legitimately be titled "למה אנחנו לא יודעים לבחור CRM",
 * and that must still be treated as the topic it plainly is.
 */
const NOT_A_TOPIC = [
  'תחשוב לבד',
  'תחשוב אתה',
  'תחליט אתה',
  'תחליט לבד',
  'תבחר אתה',
  'תבחר לבד',
  'מה שבא לך',
  'מה שאתה רוצה',
  'לא יודע',
  'לא יודעת',
  'אין לי מושג',
  'אין לי רעיון',
  'משהו',
  'כל דבר',
  'תפתיע אותי',
  'whatever',
  'anything',
  'you decide',
  '?',
  '??',
];

function isNotATopic(s: string): boolean {
  const norm = s.trim().replace(/[.!]+$/, '').toLowerCase();
  if (!norm) return false;
  return NOT_A_TOPIC.includes(norm);
}

/**
 * The newest radar item nobody has used or dismissed yet. Verified items
 * come first — those are the ones a human already checked against the
 * source, so they are the safest thing to hand an unattended generation.
 */
async function pickFreshOpportunity(aiStores: AiStores): Promise<Opportunity | null> {
  const open = await aiStores.opportunities.list({ status: 'new' });
  if (open.length === 0) return null;
  const ranked = [...open].sort((a, b) => {
    const av = a.verification === 'verified' ? 1 : 0;
    const bv = b.verification === 'verified' ? 1 : 0;
    if (av !== bv) return bv - av;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
  return ranked[0] ?? null;
}

/** Returns null when the form has neither a valid opportunity nor a topic. */
export async function buildBriefFromForm(f: FormData, aiStores: AiStores): Promise<Brief | null> {
  const opportunityId = String(f.get('opportunityId') ?? '').trim() || undefined;

  if (opportunityId) {
    const opp = await aiStores.opportunities.get(opportunityId);
    if (!opp) return null;
    return buildBriefFromOpportunity(opp);
  }

  const topicRaw = String(f.get('topic') ?? '').trim();
  const askedForAuto = String(f.get('autoTopic') ?? '').trim() !== '' || isNotATopic(topicRaw);

  if (askedForAuto) {
    // Prefer a real, current item off the radar over a topic invented from
    // nothing: it is grounded in something that actually happened, and it
    // reuses the whole opportunity pipeline (source URL, angle, region).
    const fresh = await pickFreshOpportunity(aiStores);
    if (fresh) return buildBriefFromOpportunity(fresh);
    return {
      topic: '',
      autoTopic: true,
      goal: isNotATopic(String(f.get('goal') ?? '').trim()) ? '' : String(f.get('goal') ?? '').trim(),
      audience: String(f.get('audience') ?? '').trim(),
      contentKind: VALID_KINDS.includes(String(f.get('contentKind') ?? '') as ContentKind)
        ? (String(f.get('contentKind')) as ContentKind)
        : 'evergreen',
      serviceSlug: String(f.get('serviceSlug') ?? '').trim(),
      notes: String(f.get('notes') ?? '').trim(),
    };
  }

  const topic = topicRaw;
  if (!topic) return null;
  const contentKindRaw = String(f.get('contentKind') ?? 'evergreen');
  return {
    topic,
    goal: String(f.get('goal') ?? '').trim(),
    audience: String(f.get('audience') ?? '').trim(),
    contentKind: VALID_KINDS.includes(contentKindRaw as ContentKind) ? (contentKindRaw as ContentKind) : 'evergreen',
    serviceSlug: String(f.get('serviceSlug') ?? '').trim(),
    notes: String(f.get('notes') ?? '').trim(),
  };
}
