// PUBLIC contact form endpoint. No admin session, no CSRF token from the
// admin auth system, no import from src/lib/cms/* anywhere in this file or
// its dependencies (src/lib/leads/*). A public form cannot grant admin
// access because there is no code path here that touches admin identity.
//
// FLOW, IN ORDER:
//   1. cheap bot checks (honeypot, timing)            - reject silently
//   2. Turnstile verification                         - reject silently
//   3. rate limit                                     - reject, friendly message
//   4. field validation and sanitisation               - reject, field error
//   5. duplicate-submission fold (double click guard)
//   6. STORE THE LEAD                                  <- happens before email
//   7. send the notification email, best effort
//   8. respond success either way, since the lead is already saved
export const prerender = false;

import type { APIRoute } from 'astro';
import { SERVICES } from '../../lib/site';
import { getLeadEnv, hashIp, newLeadId } from '../../lib/leads/context.ts';
import { checkRateLimit, looksLikeBot, validateAndClean, verifyTurnstile } from '../../lib/leads/spam.ts';
import { sendLeadEmail } from '../../lib/leads/notify.ts';

const SERVICE_SLUGS = SERVICES.map((s) => s.slug);
const SERVICE_NAMES: Record<string, string> = Object.fromEntries(SERVICES.map((s) => [s.slug, s.name]));

const DUPLICATE_WINDOW_MS = 3 * 60_000;

function wantsJson(request: Request): boolean {
  const accept = request.headers.get('accept') ?? '';
  const ct = request.headers.get('content-type') ?? '';
  return accept.includes('application/json') || ct.includes('application/json');
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async (ctx) => {
  const { request, redirect } = ctx;
  const asJson = wantsJson(request);
  const fail = (status: number, code: string, message: string) =>
    asJson ? jsonResponse({ ok: false, code, error: message }, status) : redirect('/contact/?error=' + code, 303);

  let data: Record<string, unknown>;
  const ct = request.headers.get('content-type') ?? '';
  try {
    if (ct.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
  } catch {
    return fail(400, 'bad_request', 'הבקשה לא תקינה.');
  }

  const ip =
    request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for');
  const userAgent = request.headers.get('user-agent');

  // ── 1. honeypot + timing ────────────────────────────────────────────
  const honeypot = String(data.website_url ?? '');
  const renderedAt = Number(data.form_rendered_at ?? 0);
  if (looksLikeBot(honeypot, renderedAt)) {
    console.log(JSON.stringify({ event: 'contact_blocked', reason: 'bot_heuristic', ipHash: hashIp(ip) }));
    // Pretend success so an automated sender has no signal to react to.
    // Nothing is stored, no email is sent.
    return asJson ? jsonResponse({ ok: true }) : redirect('/contact/?sent=1', 303);
  }

  const env = getLeadEnv();

  // ── 2. Turnstile ─────────────────────────────────────────────────────
  const turnstileToken = String(data['cf-turnstile-response'] ?? '');
  if (env.turnstileSecretKey) {
    if (!turnstileToken) {
      console.log(JSON.stringify({ event: 'contact_blocked', reason: 'turnstile_missing', ipHash: hashIp(ip) }));
      return fail(400, 'turnstile', 'לא הצלחנו לאמת שמדובר באדם. נסו שוב.');
    }
    const human = await verifyTurnstile(turnstileToken, env.turnstileSecretKey, ip ?? undefined);
    if (!human) {
      console.log(JSON.stringify({ event: 'contact_blocked', reason: 'turnstile_failed', ipHash: hashIp(ip) }));
      return fail(400, 'turnstile', 'לא הצלחנו לאמת שמדובר באדם. נסו שוב.');
    }
  } else {
    console.warn('TURNSTILE_SECRET_KEY not configured; contact form is running without bot verification');
  }

  // ── 3. rate limit ────────────────────────────────────────────────────
  const rateKey = hashIp(ip) ?? 'unknown';
  const allowed = await checkRateLimit(env.rateLimiter, rateKey);
  if (!allowed) {
    console.log(JSON.stringify({ event: 'contact_blocked', reason: 'rate_limited', ipHash: rateKey }));
    return fail(429, 'rate_limited', 'יותר מדי ניסיונות בזמן קצר. נסו שוב בעוד כמה דקות, או כתבו לנו בוואטסאפ.');
  }

  // ── 4. validation and sanitisation ──────────────────────────────────
  const result = validateAndClean(data, SERVICE_SLUGS);
  if (!result.ok) {
    return fail(400, 'validation', result.error);
  }
  const fields = result.fields;

  // ── 5. fold an accidental double submit into the first lead ─────────
  const dup = await env.leads.findRecentDuplicate(fields.email, fields.phone, DUPLICATE_WINDOW_MS);
  if (dup) {
    return asJson ? jsonResponse({ ok: true, duplicate: true }) : redirect('/contact/?sent=1', 303);
  }

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
    console.error(JSON.stringify({ event: 'contact_email_failed', leadId: lead.id, error: emailResult.error }));
  }

  // ── 8. the lead is safely stored either way, so the visitor sees success
  return asJson ? jsonResponse({ ok: true }) : redirect('/contact/?sent=1', 303);
};
