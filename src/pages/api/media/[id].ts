// Serves one uploaded media image to the PUBLIC internet -- this is
// deliberately NOT behind /api/admin/, because it is what <img src> and
// og:image tags on public pages point at. It reveals only image bytes,
// content-type and cache headers: never alt text, filenames, or who
// uploaded it (those stay admin-only, via the media store's list()).
export const prerender = false;

import type { APIRoute } from 'astro';
import { base64ToBytes } from '../../../lib/cms/media.ts';

export const GET: APIRoute = async ({ params, locals }) => {
  const id = params.id ?? '';
  const row = await locals.stores!.media.getWithData(id).catch(() => null);
  if (!row) return new Response('not found', { status: 404 });

  const bytes = base64ToBytes(row.dataB64);
  // TS's current BodyInit typing wants a plain ArrayBuffer-backed view;
  // Uint8Array is generic over ArrayBufferLike now and doesn't always
  // satisfy that overload even though it works fine at runtime.
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      'content-type': row.mime,
      // Images are immutable once uploaded (a new upload gets a new id),
      // so this can be cached hard at the edge and in the browser.
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
};
