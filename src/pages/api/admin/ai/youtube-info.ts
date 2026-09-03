// Looks up a YouTube video's real title via YouTube's own public oEmbed
// endpoint, so pasting a link into the editor fills in a caption
// automatically instead of asking the person to type one.
//
// WHY A SERVER ROUTE AND NOT A DIRECT CLIENT FETCH: youtube.com does not
// send CORS headers on oEmbed, so the browser blocks a same-page fetch to
// it outright. This route makes that one request server-side and hands
// back only the one field the editor needs.
//
// No API key, no quota: oEmbed is YouTube's public, unauthenticated
// endpoint for exactly this ("what is this video called"), same one used
// by anything that embeds a YouTube preview.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { youtubeIdFrom } from '../../../../lib/cms/types.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const GET: APIRoute = async ({ request, locals }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const url = new URL(request.url).searchParams.get('url') ?? '';
  const id = youtubeIdFrom(url);
  if (!id) return json({ error: 'לא נראה כמו קישור תקין ליוטיוב' }, 400);

  try {
    // Built from the id we already validated, not the raw pasted URL --
    // the same "never trust what came in as a URL" reasoning as everywhere
    // else this codebase touches YouTube (see youtubeIdFrom's own comment).
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${id}`
    )}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return json({ error: 'לא נמצא סרטון עם הקישור הזה' }, 404);
    const data = (await res.json()) as { title?: string };
    const title = String(data.title ?? '').trim().slice(0, 300);
    return json({ ok: true, title });
  } catch {
    return json({ error: 'לא הצלחנו לאחזר את פרטי הסרטון' }, 502);
  }
};
