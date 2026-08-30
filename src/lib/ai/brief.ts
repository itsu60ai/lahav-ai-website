// Builds a Brief from a submitted form, either from a picked opportunity
// or from fields typed by hand. Shared by the mock-generate route and the
// manual (Stage B) prepare route, so both interpret the same form shape
// identically — one definition of "what a brief is," not two that could drift.
import type { AiStores, Brief, ContentKind } from './types.ts';

const VALID_KINDS: ContentKind[] = ['hack', 'release', 'workflow', 'comparison', 'evergreen', 'trend'];

/** Returns null when the form has neither a valid opportunity nor a topic. */
export async function buildBriefFromForm(f: FormData, aiStores: AiStores): Promise<Brief | null> {
  const opportunityId = String(f.get('opportunityId') ?? '').trim() || undefined;

  if (opportunityId) {
    const opp = await aiStores.opportunities.get(opportunityId);
    if (!opp) return null;
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

  const topic = String(f.get('topic') ?? '').trim();
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
