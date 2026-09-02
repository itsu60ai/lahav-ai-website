// Sends the "you have a new lead" email via Resend's HTTP API.
//
// WHY RESEND: free tier (3,000 emails/month, 100/day, far above what a
// contact form on a small business site will ever generate), no server to
// run, one HTTP call from the Worker. See docs/CONTACT_FORM.md for the
// full explanation and the account-setup step only the client can do.
//
// WHY NOT A PAID DOMAIN YET: no domain is purchased yet (F-5 / V-2), so
// this sends from Resend's own `onboarding@resend.dev` sandbox address.
// Resend only allows that address to send to the email the Resend account
// itself was created with. If the Resend account is created using
// itsu60ai@gmail.com, notifications arrive there today at zero cost. Once
// a real domain exists, verifying it in Resend and changing FROM_EMAIL is
// a one-line change here, not a rebuild.
import type { CleanFields } from './spam.ts';

export interface EmailResult {
  sent: boolean;
  error: string | null;
}

const FROM_EMAIL = 'LAHAV AI Website <onboarding@resend.dev>';
const TO_EMAIL = 'itsu60ai@gmail.com';

function escapeHtml(s: string): string {
  return s
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;');
}

export async function sendLeadEmail(
  apiKey: string | undefined,
  fields: CleanFields,
  serviceName: string
): Promise<EmailResult> {
  if (!apiKey) {
    return { sent: false, error: 'RESEND_API_KEY not configured' };
  }

  const rows: [string, string][] = [
    ['שם', fields.name],
    ['טלפון', fields.phone],
    ['אימייל', fields.email || 'לא נמסר, השאירו טלפון בלבד'],
    ['שירות מבוקש', serviceName || 'לא צוין'],
  ];
  const html =
    '<div style="font-family:sans-serif;direction:rtl;text-align:right">' +
    '<h2>פנייה חדשה מהאתר</h2>' +
    '<table cellpadding="6">' +
    rows
      .map(
        ([k, v]) =>
          `<tr><td><b>${escapeHtml(k)}</b></td><td>${escapeHtml(v)}</td></tr>`
      )
      .join('') +
    '</table>' +
    '<p><b>ההודעה:</b></p>' +
    `<p>${escapeHtml(fields.message).split('\n').join('<br>')}</p>` +
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
        to: [TO_EMAIL],
        // lets the business owner just hit reply to answer the lead
        // directly; the address was already validated server-side, so it
        // cannot be used to inject extra headers here. Omitted entirely
        // when the visitor left a phone number only (chat panel), because
        // a reply-to that bounces is worse than no reply-to.
        ...(fields.email ? { reply_to: fields.email } : {}),
        subject: `פנייה חדשה מהאתר: ${fields.name}`,
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
