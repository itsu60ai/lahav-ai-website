// Auto-captions an already-uploaded photo, for the "+ תמונה" button in the
// article editor. The image itself is uploaded first (via
// /api/admin/media/upload, same as every other image), so this route only
// takes a mediaId and reads the bytes straight back out of the media
// library it was just stored in — never re-sent from the browser.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { captionImage } from '../../../../lib/ai/caption.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const f = await request.formData();
  const mediaId = String(f.get('mediaId') ?? '');
  if (!mediaId) return json({ error: 'חסר mediaId' }, 400);

  const row = await locals.stores!.media.getWithData(mediaId);
  if (!row) return json({ error: 'התמונה לא נמצאה' }, 404);

  try {
    const caption = await captionImage(row.dataB64, row.mime);
    return json({ ok: true, caption });
  } catch (e) {
    // Never fatal to the upload itself -- the photo is already saved and
    // usable; a failed caption just leaves the alt field empty and
    // editable, exactly like before this feature existed.
    return json({ error: e instanceof Error ? e.message : 'שגיאה לא צפויה' }, 502);
  }
};
