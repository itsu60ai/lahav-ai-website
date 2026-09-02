// Everything that decides whether a submission is real, before it ever
// reaches storage or email. Layered, server-side, and each layer is cheap
// enough that a real visitor never notices any of it.
//
//   1. honeypot        - a field bots fill and humans never see
//   2. timing          - real people take at least ~1.5s to fill a form
//   3. Turnstile       - Cloudflare's invisible bot check (not a puzzle)
//   4. rate limiting   - throttles a flood from one visitor
//   5. field validation and sanitisation - rejects junk and neutralises
//      anything that could inject HTML or break the notification email

// ─────────────────────────────────────────── honeypot + timing

/** true if a bot almost certainly filled the trap field or submitted too fast */
export function looksLikeBot(honeypotValue: string, renderedAtMs: number): boolean {
  if (honeypotValue.trim() !== '') return true;
  const elapsed = Date.now() - renderedAtMs;
  // negative means a forged/garbage timestamp; anything under ~1.2s is
  // faster than a person can plausibly read and fill this form
  return !(elapsed >= 1200 && elapsed < 1000 * 60 * 60 * 6);
}

// ─────────────────────────────────────────── Turnstile

export async function verifyTurnstile(
  token: string,
  secretKey: string,
  remoteIp: string | undefined
): Promise<boolean> {
  try {
    const body = new URLSearchParams({ secret: secretKey, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    // A network hiccup talking to Cloudflare should not be indistinguishable
    // from a bot. An API error here is logged and treated as a soft pass so
    // one outage does not silently turn away real customers.
    return true;
  }
}

// ─────────────────────────────────────────── rate limiting

/** true if this key is currently allowed through */
export async function checkRateLimit(limiter: RateLimit | undefined, key: string): Promise<boolean> {
  if (!limiter) return true; // binding not configured (e.g. some local setups)
  try {
    const { success } = await limiter.limit({ key });
    return success;
  } catch {
    return true; // never let a limiter failure block real submissions
  }
}

// ─────────────────────────────────────────── field validation

const MAX = { name: 120, phone: 40, email: 200, message: 4000 };

/**
 * Removes any character that is not a normal printable character (keeps
 * letters in every script, digits, spaces and ordinary punctuation), so
 * control characters and stray bytes are gone without writing a raw
 * control-character literal into this source file.
 */
function stripUnprintable(s: string): string {
  let out = '';
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    const isControl = code < 0x20 || code === 0x7f;
    if (!isControl) out += ch;
  }
  return out;
}

/**
 * Strips anything that could (a) inject HTML/script if this text is ever
 * rendered somewhere, or (b) inject extra headers into the notification
 * email via newlines. Astro also HTML-escapes on output by default, so
 * this is defense in depth, not the only layer.
 */
function clean(v: unknown, max: number): string {
  const withoutTags = String(v ?? '').replace(/<[^>]*>/g, ' ');
  const oneLine = withoutTags.split('\n').join(' ').split('\r').join(' ');
  return stripUnprintable(oneLine).trim().slice(0, max);
}

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
// lenient on purpose: real leads should never be rejected over formatting
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;

export interface CleanFields {
  name: string;
  phone: string;
  email: string;
  serviceSlug: string;
  message: string;
}

export interface ValidateOptions {
  /**
   * Allow an empty email. OFF by default, so the approved contact form
   * (F-10: name, phone, email, service, message) keeps requiring it
   * exactly as before. The chat panel opts in, because asking for three
   * fields inside a bubble loses people, and storing a placeholder
   * address instead would put a fake email in the leads table.
   */
  emailOptional?: boolean;
}

export function validateAndClean(
  input: Record<string, unknown>,
  knownServiceSlugs: readonly string[],
  options: ValidateOptions = {}
): { ok: true; fields: CleanFields } | { ok: false; error: string } {
  const name = clean(input.name, MAX.name);
  const phone = clean(input.phone, MAX.phone);
  const email = clean(input.email, MAX.email).toLowerCase();
  const message = clean(input.message, MAX.message);
  const serviceRaw = clean(input.service, 60);
  const serviceSlug = knownServiceSlugs.includes(serviceRaw) ? serviceRaw : '';

  if (!name) return { ok: false, error: 'נא למלא שם' };
  if (!phone || !PHONE_RE.test(phone)) return { ok: false, error: 'מספר הטלפון לא תקין' };
  if (options.emailOptional) {
    // Given but malformed is still an error; simply absent is fine.
    if (email && !EMAIL_RE.test(email)) return { ok: false, error: 'כתובת האימייל לא תקינה' };
  } else if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'כתובת האימייל לא תקינה' };
  }
  if (!message || message.length < 3) return { ok: false, error: 'נא לכתוב כמה מילים על הפנייה' };

  return { ok: true, fields: { name, phone, email, serviceSlug, message } };
}
