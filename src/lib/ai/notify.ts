// D4, layer 9: the email sent on EVERY auto publish, with a one click
// unpublish link.
//
// WHY THIS IS A SEPARATE FILE FROM src/lib/leads/notify.ts: that one
// notifies about a sales lead and its shape is tied to CleanFields. This
// one notifies about the site publishing something in the company's name
// without a human clicking publish, which is a different event with a
// different urgency and a different action. Repurposing the lead notifier
// would couple two things that should be able to change independently.
// The Resend transport pattern is deliberately identical, because that
// part is already proven to work here.
import type { AutoPublication } from './types.ts';

export interface EmailResult {
  sent: boolean;
  error: string | null;
}

const FROM_EMAIL = 'LAHAV AI Website <onboarding@resend.dev>';
/** Same default recipient as the lead notifier, for the same reason: the
 *  Resend sandbox address can only send to the account's own address. The
 *  admin can override this in the settings screen. */
const DEFAULT_TO_EMAIL = 'itsu60ai@gmail.com';

function escapeHtml(s: string): string {
  return s
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;');
}

export async function sendAutoPublishEmail(args: {
  apiKey: string | undefined;
  to: string;
  siteOrigin: string;
  publication: AutoPublication;
}): Promise<EmailResult> {
  const { apiKey, siteOrigin, publication } = args;
  if (!apiKey) return { sent: false, error: 'RESEND_API_KEY not configured' };

  const to = args.to || DEFAULT_TO_EMAIL;
  const articleUrl = `${siteOrigin}/articles/${publication.articleSlug}`;
  // The one click unpublish link. The token is a single stored capability
  // on this one article; it does not sign anyone in and cannot do anything
  // else. See src/pages/api/ai-unpublish.ts.
  const unpublishUrl = `${siteOrigin}/api/ai-unpublish?token=${encodeURIComponent(publication.unpublishToken)}`;

  const html =
    '<div style="font-family:sans-serif;direction:rtl;text-align:right">' +
    '<h2>המערכת פרסמה מאמר באופן אוטומטי</h2>' +
    '<p>המאמר הבא עלה לאתר בלי שאישרתם אותו ידנית, כי פרסום אוטומטי מופעל כרגע.</p>' +
    `<p><b>${escapeHtml(publication.articleTitle)}</b></p>` +
    `<p><a href="${escapeHtml(articleUrl)}">צפייה במאמר באתר</a></p>` +
    `<p>פורסם בתאריך ${escapeHtml(publication.publishedAt)}.</p>` +
    `<p>פרסום אוטומטי הופעל על ידי ${escapeHtml(publication.armedBy || 'לא ידוע')}.</p>` +
    '<hr>' +
    '<p><b>אם המאמר הזה לא צריך להיות באוויר:</b></p>' +
    `<p><a href="${escapeHtml(unpublishUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;` +
    'padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">' +
    'הסרה מפרסום בלחיצה אחת</a></p>' +
    '<p style="font-size:13px;color:#6b7793">' +
    'הקישור מסיר את המאמר הזה בלבד מהאתר ומחזיר אותו למצב טיוטה. הוא אינו מוחק אותו ואינו מכבה ' +
    'את הפרסום האוטומטי. לכיבוי מלא, היכנסו למסך ההגדרות.' +
    '</p>' +
    '</div>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `פורסם אוטומטית: ${publication.articleTitle}`,
        html,
      }),
    });

    if (res.ok) return { sent: true, error: null };
    const body = await res.text().catch(() => '');
    return { sent: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
  } catch (err) {
    return { sent: false, error: 'network error: ' + String(err).slice(0, 200) };
  }
}
