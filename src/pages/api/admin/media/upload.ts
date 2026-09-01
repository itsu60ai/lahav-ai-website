// Upload an image to the media library. Stored as base64 in D1 -- see
// migrations/0007_website_cms.sql for why R2 is not used (not enabled on
// this Cloudflare account yet) -- so uploads are capped hard well before
// any query runs, in src/lib/cms/media.ts.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { validateUpload, bytesToBase64, readDimensions } from '../../../../lib/cms/media.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = require_(locals.user, 'media:upload');
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: 'לא נבחר קובץ' }, 400);

  const alt = String(form.get('alt') ?? '').trim().slice(0, 300);

  const result = await validateUpload(file);
  if (!result.ok) return json({ error: result.error }, 400);

  const dims = readDimensions(result.bytes, result.mime);
  const row = await locals.stores!.media.create({
    filename: file.name.slice(0, 200) || 'image',
    alt,
    mime: result.mime,
    width: dims?.width ?? null,
    height: dims?.height ?? null,
    sizeBytes: result.bytes.byteLength,
    dataB64: bytesToBase64(result.bytes),
    createdBy: locals.user!.id,
  });

  return json({ ok: true, media: row });
};
