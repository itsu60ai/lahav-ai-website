// Records approval/rejection and an optional correction note. This is the
// entry point to the learning system: a note on a rejection or an edit
// becomes a candidate rule immediately, at zero cost. See src/lib/ai/learn.ts.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';
import { recordFeedback } from '../../../../lib/ai/learn.ts';
import type { FeedbackKind } from '../../../../lib/ai/types.ts';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const f = await request.formData();
  const generationId = String(f.get('generationId') ?? '');
  const articleId = String(f.get('articleId') ?? '') || null;
  const kindRaw = String(f.get('kind') ?? '');
  const note = String(f.get('note') ?? '').trim();

  if (generationId && (kindRaw === 'approve' || kindRaw === 'reject')) {
    await recordFeedback(getAiStores(), {
      generationId,
      articleId,
      kind: kindRaw as FeedbackKind,
      note,
    });
  }

  return redirect(`/admin/ai/${generationId}`, 303);
};
