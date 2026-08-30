// The learning substrate. See docs/AI_ENGINE.md sections 3.2 and 10.
//
// ZERO COST BY DESIGN: this file makes no AI call. The design document
// describes an eventual cheap AI call to condense many notes into fewer,
// sharper rules — that condensing step is deferred, not built here, so
// nothing in the learning path depends on a paid provider. What Stage A
// does instead: every rejection or edit note the admin types becomes a
// rule candidate directly. Typing the same correction more than once
// naturally raises that rule's sourceCount (ai_rules.upsertByText already
// deduplicates by exact text), which is a real, working signal of what
// matters, even before any condensing exists.
import type { AiStores, FeedbackKind } from './types.ts';

export async function recordFeedback(
  stores: AiStores,
  args: {
    generationId: string;
    articleId: string | null;
    kind: FeedbackKind;
    field?: string;
    beforeText?: string;
    afterText?: string;
    note?: string;
  }
): Promise<void> {
  await stores.feedback.create({
    generationId: args.generationId,
    articleId: args.articleId,
    kind: args.kind,
    field: args.field ?? '',
    beforeText: args.beforeText ?? '',
    afterText: args.afterText ?? '',
    note: args.note ?? '',
  });

  // A rejection or an edit with an explanation is the highest-value
  // signal in the system (docs/AI_ENGINE.md section 11) — it becomes a
  // candidate rule immediately, with no AI call and no delay.
  const note = args.note?.trim();
  if (note && (args.kind === 'reject' || args.kind === 'edit')) {
    await stores.rules.upsertByText(note);
  }
}

export async function activeRulesText(stores: AiStores): Promise<string[]> {
  const rules = await stores.rules.listActive();
  return rules.map((r) => r.ruleText);
}
