// D4, layer 10: the one click unpublish link from the auto publish email.
//
// WHY THIS IS OUTSIDE /api/admin: it has to work from an email client, on
// a phone, with no admin session. That is the entire point of "one click".
//
// WHY THAT IS SAFE: the token is a random 128 bit value stored on exactly
// one ai_auto_publications row, and redeeming it can do exactly one thing:
// move that one article from `published` back to `draft`. It cannot sign
// anyone in, cannot read anything, cannot delete anything, cannot touch a
// second article, and cannot change any setting. It is a capability for a
// single reversible action, and the action it performs is the SAFE
// direction (taking content off the public site, never putting it on).
//
// It is also single use: once redeemed, unpublished_at is set and a replay
// is refused.
//
// GET is used deliberately, because email clients only produce GET links.
// The usual objection to a state-changing GET is that it can be triggered
// by a third party without consent; here the only reachable effect is
// unpublishing an article the owner was just told about, which is the
// outcome they would choose anyway. The dangerous direction stays behind
// the admin session, CSRF and a typed phrase.
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAiStores } from '../../lib/ai/context.ts';

function page(title: string, body: string, status: number): Response {
  const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${title}</title>
<style>
body{font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;background:#f2f4f7;color:#0b1530;
margin:0;display:grid;place-items:center;min-height:100vh;padding:1.5rem}
.card{background:#fff;border-radius:14px;padding:2rem;max-width:32rem;box-shadow:0 2px 18px rgba(11,21,48,.09)}
h1{font-size:1.35rem;margin:0 0 .75rem}p{margin:0 0 .75rem;line-height:1.6;color:#3b465e}
a{color:#1d4ed8}
</style></head><body><div class="card"><h1>${title}</h1>${body}</div></body></html>`;
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex, nofollow' },
  });
}

export const GET: APIRoute = async ({ url, locals }) => {
  const token = url.searchParams.get('token') ?? '';
  const stores = getAiStores();
  const { articles } = locals.stores!;

  const publication = await stores.autoPublications.byToken(token);
  if (!publication) {
    return page(
      'הקישור אינו תקף',
      '<p>לא נמצא מאמר שמתאים לקישור הזה. ייתכן שהקישור הועתק חלקית.</p>' +
        '<p>אפשר להיכנס לניהול האתר ולשנות את מצב המאמר משם.</p>',
      404
    );
  }

  if (publication.unpublishedAt) {
    return page(
      'המאמר כבר הוסר מפרסום',
      `<p>המאמר "${publication.articleTitle}" כבר הוסר מהאתר קודם לכן. לא בוצע שינוי נוסף.</p>`,
      200
    );
  }

  const article = await articles.get(publication.articleId);
  if (!article) {
    await stores.autoPublications.markUnpublished(publication.id, 'קישור מהאימייל');
    return page('המאמר לא נמצא', '<p>המאמר כבר אינו קיים במערכת. לא בוצע שינוי.</p>', 404);
  }

  if (article.status === 'published') {
    // The only write this route performs. Draft, not delete: nothing is
    // destroyed, the article simply stops being public.
    await articles.setStatus(publication.articleId, 'draft');
  }
  await stores.autoPublications.markUnpublished(publication.id, 'קישור מהאימייל');

  return page(
    'המאמר הוסר מהאתר',
    `<p>המאמר "${publication.articleTitle}" חזר למצב טיוטה ואינו גלוי יותר לציבור.</p>` +
      '<p>התוכן עצמו נשמר במלואו, ואפשר לערוך אותו ולפרסם שוב מתוך ניהול האתר.</p>' +
      '<p>שימו לב: הפעולה הזו הסירה את המאמר הזה בלבד. פרסום אוטומטי עדיין פעיל. ' +
      'כדי לכבות אותו לגמרי, היכנסו למסך ההגדרות בניהול האתר.</p>',
    200
  );
};
