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
// ISRAELI PHONE NUMBERS.
//
// The old rule accepted any 7 to 20 characters made of digits and
// punctuation, so "1234567890123456789" and "((((((((((" both passed and
// landed in the leads table as if they were real. The business serves
// Israeli businesses, so the rule is the Israeli numbering plan:
//
//   mobile      05X XXXXXXX          10 digits, always starts 05
//   landline    0X XXXXXXX           9 digits, area codes 2,3,4,8,9
//   VoIP        07X XXXXXXX          10 digits
//   1-700/1-800 1XXX XXXXXX          10 digits, service numbers
//
// International input is accepted in +972 / 00972 form and normalised to
// the local 0 form, because that is what a person will actually dial.
const IL_MOBILE = /^05\d{8}$/;
const IL_VOIP = /^07\d{8}$/;
const IL_LANDLINE = /^0(?:2|3|4|8|9)\d{7}$/;
const IL_SERVICE = /^1(?:70[0-9]|80[0-9]|55[0-9]|59[0-9])\d{6}$/;

/**
 * Strips punctuation, converts a +972 / 00972 prefix to a local 0, and
 * returns digits only. Returns '' when there is nothing usable.
 */
export function normalisePhone(raw: string): string {
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+972')) d = '0' + d.slice(4);
  else if (d.startsWith('00972')) d = '0' + d.slice(5);
  else if (d.startsWith('972') && d.length >= 11) d = '0' + d.slice(3);
  d = d.replace(/\D/g, '');
  return d;
}

export function isIsraeliPhone(digits: string): boolean {
  return (
    IL_MOBILE.test(digits) ||
    IL_VOIP.test(digits) ||
    IL_LANDLINE.test(digits) ||
    IL_SERVICE.test(digits)
  );
}

export interface CleanFields {
  name: string;
  phone: string;
  email: string;
  serviceSlug: string;
  message: string;
}

export function validateAndClean(
  input: Record<string, unknown>,
  knownServiceSlugs: readonly string[]
): { ok: true; fields: CleanFields } | { ok: false; error: string } {
  const name = clean(input.name, MAX.name);
  const phone = clean(input.phone, MAX.phone);
  const email = clean(input.email, MAX.email).toLowerCase();
  const message = clean(input.message, MAX.message);
  const serviceRaw = clean(input.service, 60);
  const serviceSlug = knownServiceSlugs.includes(serviceRaw) ? serviceRaw : '';

  if (!name) return { ok: false, error: 'נא למלא שם' };
  const phoneDigits = normalisePhone(phone);
  if (!phoneDigits || !isIsraeliPhone(phoneDigits)) {
    return { ok: false, error: 'מספר טלפון ישראלי לא תקין. לדוגמה: 050-1234567' };
  }
  // Required everywhere, including the chat panel: the client wants every
  // lead to carry an email so it can feed automations later.
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: 'כתובת האימייל לא תקינה' };
  if (!message || message.length < 3) return { ok: false, error: 'נא לכתוב כמה מילים על הפנייה' };

  return { ok: true, fields: { name, phone: phoneDigits, email, serviceSlug, message } };
}
