// "CALL ME BACK", FROM INSIDE THE CHAT.
//
// A real lead, through the SAME pipeline as the contact form: same
// validation, same store-before-email order, same D1 table, same
// notification email. It is a second door into one room, not a second
// room. Read src/pages/api/contact.ts alongside this file; the order of
// operations there is the order here.
//
// ISOLATION: imports src/lib/leads/* and src/lib/site only. No import
// from src/lib/cms/*, no admin session, no CSRF token from the admin auth
// system, no path to admin identity of any kind.
//
// NO TURNSTILE, AND WHAT REPLACES IT: the chat panel has no Turnstile
// widget, so the two cheap layers do the work instead:
//   1. honeypot field + minimum dwell time  (looksLikeBot)
//   2. the CONTACT_RATE_LIMITER, keyed on the hashed IP, exactly as the
//      contact form uses it
// Both are server-side. A bot that beats them lands one lead, which is
// the same exposure the contact form already accepts on a Turnstile
// outage (verifyTurnstile soft-passes there).
export const prerender = false;

import type { APIRoute } from 'astro';
import { SERVICES } from '../../../lib/site';
import { getLeadEnv, hashIp, newLeadId } from '../../../lib/leads/context.ts';
import { checkRateLimit, looksLikeBot, validateAndClean } from '../../../lib/leads/spam.ts';
import { sendLeadEmail } from '../../../lib/leads/notify.ts';
import { pageContext } from '../../../lib/chat/pages.ts';

const SERVICE_SLUGS = SERVICES.map((s) => s.slug);
const SERVICE_NAMES: Record<string, string> = Object.fromEntries(SERVICES.map((s) => [s.slug, s.name]));

const DUPLICATE_WINDOW_MS = 3 * 60_000;

/** How much of the conversation travels with the lead. */
const CONTEXT_TURNS = 6;
const CONTEXT_CHARS = 300;
const MAX_MESSAGE = 3500;

// The chat asks for name, phone and email. Email is REQUIRED here, exactly
// as on the contact form: the client wants every lead to carry one so the
// list can feed automations later.

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** Renders the last few turns as plain text for the notification email. */
function transcript(raw: unknown): string {
  if (!Array.isArray(raw)) return '';
  const lines: string[] = [];
  for (const m of raw.slice(-CONTEXT_TURNS)) {
    const role = (m as any)?.role;
    const content = (m as any)?.content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
    const who = role === 'user' ? 'המבקר' : 'העוזר';
    lines.push(`${who}: ${content.slice(0, CONTEXT_CHARS)}`);
  }
  return lines.join('\n');
}

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, unknown>;
  try {
    data = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, code: 'bad_request', error: 'הבקשה לא תקינה.' }, 400);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for');
  const userAgent = request.headers.get('user-agent');

  // ── 1. honeypot + dwell time ────────────────────────────────────────
  const honeypot = String(data.website_url ?? '');
  const renderedAt = Number(data.form_rendered_at ?? 0);
  if (looksLikeBot(honeypot, renderedAt)) {
    console.log(JSON.stringify({ event: 'chat_lead_blocked', reason: 'bot_heuristic', ipHash: hashIp(ip) }));
    // Pretend success so an automated sender has no signal to react to.
    // Nothing is stored, no email is sent.
    return json({ ok: true });
  }

  const env = getLeadEnv();

  // ── 2. rate limit, the contact form's own limiter ────────────────────
  const rateKey = hashIp(ip) ?? 'unknown';
  const allowed = await checkRateLimit(env.rateLimiter, rateKey);
  if (!allowed) {
    console.log(JSON.stringify({ event: 'chat_lead_blocked', reason: 'rate_limited', ipHash: rateKey }));
    return json(
      { ok: false, code: 'rate_limited', error: 'יותר מדי ניסיונות בזמן קצר. נסו שוב בעוד כמה דקות, או כתבו לנו בוואטסאפ.' },
      429
    );
  }

  // ── 3. build the lead's message from the conversation ────────────────
  // The page is matched against the closed table in lib/chat/pages.ts,
  // so the service slug is ours, never the client's raw string.
  const ctx = pageContext(data.page);
  const note = String(data.note ?? '').trim();
  const email = String(data.email ?? '').trim();
  const parts = ['פנייה שנפתחה מתוך הצ׳אט באתר.'];
  if (ctx.line) parts.push(ctx.line);
  if (note) parts.push(`מה שנכתב בטופס: ${note}`);
  const turns = transcript(data.messages);
  if (turns) parts.push(`מהשיחה:\n${turns}`);
  const message = parts.join('\n').slice(0, MAX_MESSAGE);

  // ── 4. validation and sanitisation, the shared rules ─────────────────
  const result = validateAndClean(
    {
      name: data.name,
      phone: data.phone,
      email,
      service: ctx.serviceSlug,
      message,
    },
    SERVICE_SLUGS
  );
  if (!result.ok) {
    return json({ ok: false, code: 'validation', error: result.error }, 400);
  }
  const fields = result.fields;

  // ── 5. fold an accidental double submit into the first lead ─────────
  const dup = await env.leads.findRecentDuplicate(fields.email, fields.phone, DUPLICATE_WINDOW_MS);
  if (dup) return json({ ok: true, duplicate: true });

  // ── 6. STORE FIRST. Nothing below this line can lose the lead. ──────
  const lead = await env.leads.create({
    id: newLeadId(),
    name: fields.name,
    phone: fields.phone,
    email: fields.email,
    serviceSlug: fields.serviceSlug,
    message: fields.message,
    ipHash: hashIp(ip),
    userAgent: userAgent ? userAgent.slice(0, 300) : null,
  });

  // ── 7. best-effort notification. Failure here never loses the lead. ─
  const serviceName = SERVICE_NAMES[fields.serviceSlug] ?? '';
  const emailResult = await sendLeadEmail(env.resendApiKey, fields, serviceName);
  await env.leads.markEmailResult(lead.id, emailResult.sent, emailResult.error);
  if (!emailResult.sent) {
    console.error(JSON.stringify({ event: 'chat_lead_email_failed', leadId: lead.id, error: emailResult.error }));
  }

  // ── 8. the lead is safely stored either way ─────────────────────────
  return json({ ok: true });
};
