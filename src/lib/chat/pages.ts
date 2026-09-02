// PAGE AWARENESS FOR THE ASSISTANT.
//
// The visitor's current page is a strong hint about what they want to ask.
// This file is the ONLY place that turns a URL into anything the model or
// the panel sees.
//
// SECURITY RULE, non negotiable: the raw path from the client is never
// concatenated into the system prompt. It is matched against the closed
// table below and, on a match, a FIXED line that is written here by hand
// is used. A path that does not match falls back to the home entry. So a
// crafted URL cannot inject instructions into the prompt.
//
// Nothing here invents facts: the context line only states where the
// visitor is standing, and the chips are questions, not claims.

export interface PageContext {
  /** stable key, used by the client for its sessionStorage bookkeeping */
  key: string;
  /** one line appended to the system prompt. Hand written, never user data. */
  line: string;
  /** the opening bot bubble on this page */
  greeting: string;
  /** opening suggestion chips for this page */
  chips: readonly string[];
  /** pre-selects the service on a lead created from this page, when known */
  serviceSlug: string;
}

/** The home / unknown-page entry. Its greeting is the approved original. */
const HOME: PageContext = {
  key: 'home',
  line: '',
  greeting: 'היי! יש לכם שאלות על AI או אוטומציות? אני כאן כדי לעשות סדר ולחסוך לכם זמן.',
  chips: [
    'איך זה חוסך לי כסף?',
    'איזה שירות מתאים לי?',
    'איך מתחילים?',
    'רוצה לקבוע שיחה קצרה',
  ],
  serviceSlug: '',
};

/** Exact paths. Everything is stored with a leading and trailing slash. */
const EXACT: Record<string, PageContext> = {
  '/': HOME,

  '/services/': {
    key: 'services',
    line: 'המבקר נמצא עכשיו בעמוד כל השירותים.',
    greeting: 'היי! אתם מסתכלים על השירותים. אשמח לעזור לכם להבין מה מתאים לעסק שלכם.',
    chips: ['מה ההבדל בין השירותים?', 'איזה שירות מתאים לי?', 'איך מתחילים?'],
    serviceSlug: '',
  },

  '/services/crm/': {
    key: 'svc-crm',
    line: 'המבקר נמצא עכשיו בעמוד מערכות CRM.',
    greeting: 'היי! אתם בעמוד מערכות CRM. תשאלו אותי כל דבר על ניהול לקוחות ופניות.',
    chips: ['מה זה CRM בעצם?', 'למי זה מתאים?', 'איך מתחילים עם CRM?'],
    serviceSlug: 'crm',
  },

  '/services/automations/': {
    key: 'svc-automations',
    line: 'המבקר נמצא עכשיו בעמוד אוטומציות עסקיות.',
    greeting: 'היי! אתם בעמוד האוטומציות. תשאלו אותי מה אפשר לאוטמט בעסק שלכם.',
    chips: ['מה אפשר לאוטמט אצלי?', 'איך אוטומציה עובדת?', 'איך מתחילים?'],
    serviceSlug: 'automations',
  },

  '/services/web-development/': {
    key: 'svc-web',
    line: 'המבקר נמצא עכשיו בעמוד פיתוח אתרים.',
    greeting: 'היי! אתם בעמוד פיתוח האתרים. אשמח לענות על שאלות לגבי אתר לעסק שלכם.',
    chips: ['מה כולל אתר כזה?', 'איך אתר מביא פניות?', 'איך מתחילים?'],
    serviceSlug: 'web-development',
  },

  '/services/app-development/': {
    key: 'svc-app',
    line: 'המבקר נמצא עכשיו בעמוד פיתוח אפליקציות.',
    greeting: 'היי! אתם בעמוד פיתוח האפליקציות. תשאלו אותי מה מתאים לעסק שלכם.',
    chips: ['מתי צריך אפליקציה?', 'מה התהליך?', 'איך מתחילים?'],
    serviceSlug: 'app-development',
  },

  '/services/ai-content/': {
    key: 'svc-content',
    line: 'המבקר נמצא עכשיו בעמוד יצירת תוכן באמצעות AI.',
    greeting: 'היי! אתם בעמוד יצירת תוכן עם AI. אשמח להסביר איך זה עובד.',
    chips: ['איך יוצרים תוכן עם AI?', 'זה נשמע כמו העסק שלי?', 'איך מתחילים?'],
    serviceSlug: 'ai-content',
  },

  '/contact/': {
    key: 'contact',
    line: 'המבקר נמצא עכשיו בעמוד צור קשר.',
    greeting: 'היי! אם נוח לכם, אפשר להשאיר פרטים כאן בצ׳אט ונחזור אליכם.',
    chips: ['מה קורה בשיחת ההיכרות?', 'רוצה שתחזרו אליי', 'איזה שירות מתאים לי?'],
    serviceSlug: '',
  },

  '/faq/': {
    key: 'faq',
    line: 'המבקר נמצא עכשיו בעמוד השאלות הנפוצות.',
    greeting: 'היי! יש שאלה שלא מצאתם כאן? תשאלו אותי.',
    chips: ['כמה זה עולה?', 'כמה זמן זה לוקח?', 'איך מתחילים?'],
    serviceSlug: '',
  },

  '/about/': {
    key: 'about',
    line: 'המבקר נמצא עכשיו בעמוד אודות.',
    greeting: 'היי! אשמח לענות על שאלות לגבי איך אנחנו עובדים.',
    chips: ['איך תהליך העבודה עובד?', 'איזה שירות מתאים לי?', 'איך מתחילים?'],
    serviceSlug: '',
  },

  '/portfolio/': {
    key: 'portfolio',
    line: 'המבקר נמצא עכשיו בעמוד הפרויקטים לדוגמה.',
    greeting: 'היי! אתם מסתכלים על פרויקטים לדוגמה. אשמח להסביר מה עומד מאחוריהם.',
    chips: ['איך בונים משהו כזה?', 'איזה שירות מתאים לי?', 'איך מתחילים?'],
    serviceSlug: '',
  },

  '/articles/': {
    key: 'articles',
    line: 'המבקר נמצא עכשיו בעמוד המאמרים.',
    greeting: 'היי! אשמח לענות על שאלות שעלו לכם תוך כדי קריאה.',
    chips: ['איך זה מתחבר לעסק שלי?', 'איזה שירות מתאים לי?', 'איך מתחילים?'],
    serviceSlug: '',
  },
};

/** Prefixes whose remainder is a single slug we deliberately do NOT read. */
const PREFIX: { prefix: string; ctx: PageContext }[] = [
  {
    prefix: '/portfolio/',
    ctx: {
      key: 'portfolio-item',
      line: 'המבקר צופה בפרויקט לדוגמה.',
      greeting: 'היי! אתם צופים בפרויקט לדוגמה. אשמח להסביר איך דברים כאלה נבנים.',
      chips: ['איך בונים משהו כזה?', 'זה מתאים גם לעסק שלי?', 'איך מתחילים?'],
      serviceSlug: '',
    },
  },
  {
    prefix: '/articles/',
    ctx: {
      key: 'article',
      line: 'המבקר קורא עכשיו מאמר באתר.',
      greeting: 'היי! יש שאלה על מה שקראתם? אני כאן.',
      chips: ['איך זה מתחבר לעסק שלי?', 'איזה שירות מתאים לי?', 'איך מתחילים?'],
      serviceSlug: '',
    },
  },
];

/** A single path segment we are willing to accept as "some slug". */
const SLUG_RE = /^[a-z0-9-]{1,64}$/;

/** Normalises to a lowercase path with one leading and one trailing slash. */
function normalise(raw: unknown): string {
  let p = typeof raw === 'string' ? raw : '/';
  // a client could send a full URL; keep only the path part
  const cut = p.search(/[?#]/);
  if (cut >= 0) p = p.slice(0, cut);
  p = p.trim().toLowerCase();
  if (p.length > 200) return '/';
  if (!p.startsWith('/')) p = '/' + p;
  if (!p.endsWith('/')) p += '/';
  return p;
}

/**
 * Resolves a client-supplied path to an entry in the closed table above.
 * Never returns anything derived from the input itself.
 */
export function pageContext(raw: unknown): PageContext {
  const path = normalise(raw);
  const exact = EXACT[path];
  if (exact) return exact;

  for (const { prefix, ctx } of PREFIX) {
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length, -1);
    if (rest && !rest.includes('/') && SLUG_RE.test(rest)) return ctx;
  }
  return HOME;
}

/** The extra system-prompt line for a page, or '' on the home page. */
export function pageContextLine(raw: unknown): string {
  const line = pageContext(raw).line;
  return line ? `\n\nהקשר: ${line}` : '';
}

export { HOME as HOME_PAGE_CONTEXT };
