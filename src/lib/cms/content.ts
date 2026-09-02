// WEBSITE CONTENT CMS — shapes, defaults, and the public-facing resolver.
//
// CODE controls layout, structure, styling, animation. This file is the
// seam where CMS-editable TEXT enters that fixed structure: every shape
// below maps to specific, predefined places in specific components. There
// is no freeform field anywhere — an editor cannot add a section that
// does not already exist in code.
//
// DEFAULT VALUES ARE THE CURRENT APPROVED COPY, taken verbatim from
// src/lib/site.ts. They serve two purposes:
//   1. the seed migration writes them into D1 so the CMS starts in the
//      exact state the site is already in (no re-entry, no rewrite);
//   2. they are the fallback whenever D1 has nothing published yet, or a
//      read fails. The public site can never render blank because of
//      this file (brief §17).
import {
  CTA_PRIMARY,
  DISCOVERY_BOOKING_URL,
  FOUNDER,
  NAV,
  SERVICES,
  SERVICE_PAGES,
  WHATSAPP_HREF,
} from '../site.ts';
import type { ContentPageStore } from './types.ts';

// ─────────────────────────────────────────────────────── shared SEO shape

export interface SeoFields {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  /** a media id from the `media` table, or '' for none */
  ogImage: string;
  noindex: boolean;
}

const seoDefault = (title: string, description: string): SeoFields => ({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: '',
  noindex: false,
});

// ────────────────────────────────────────────────────────────── HOME

export interface HomeContent {
  hero: {
    eyebrow: string;
    // Two fields, not one headline string, because the template reveals
    // them as two separately-timed lines (see hero__title in
    // src/pages/index.astro) -- an editor changes the words, not the
    // animation's structure.
    headlineLine1: string;
    headlineLine2: string;
    lead: string;
  };
  seo: SeoFields;
}

export const HOME_DEFAULT: HomeContent = {
  hero: {
    eyebrow: 'מערכות AI ואוטומציה לעסקים',
    headlineLine1: 'בזמן שאתם עובדים קשה,',
    headlineLine2: 'העסק שלכם יכול לעבוד לבד.',
    lead:
      'די לרדוף אחרי לידים בוואטסאפ, להעתיק שורות לאקסל ולשכוח לחזור ללקוחות. אנחנו הופכים את העסק שלכם למכונה חכמה, יעילה ומבוססת AI: עם אוטומציות מדויקות, CRM חכם ואתרים שמביאים עבודה.',
  },
  seo: seoDefault(
    'LAHAV AI, מערכות ואוטומציות שעושות סדר בעסק',
    'מערכות שעושות סדר במידע העסקי ומטפלות בפעולות שאפשר להגדיר מראש: CRM, אוטומציות, אתרים, אפליקציות ותוכן בסיוע AI.'
  ),
};

// ────────────────────────────────────────────────────────────── ABOUT

// Same shape as Home's hero, and for the same reason: the h1 is two
// separately-timed spans in the template (src/pages/about.astro), so two
// fields, not one string that code would have to re-split.
export interface AboutContent {
  hero: {
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
    lead: string;
  };
  founderRole: string;
  seo: SeoFields;
}

export const ABOUT_DEFAULT: AboutContent = {
  hero: {
    eyebrow: 'אודות',
    headlineLine1: 'קודם העסק,',
    headlineLine2: 'רק אז הטכנולוגיה.',
    lead: 'לפני שבוחרים כלי, נבין איך הפניות והכסף זזים אצלכם, איפה זה נתקע, ומה באמת חייב להשתנות.',
  },
  founderRole: FOUNDER.role,
  seo: seoDefault(
    'אודות | LAHAV AI',
    'LAHAV AI מתמחה בתכנון ובהקמה של מערכות חכמות לעסקים. מתחילים מהתהליך העסקי, ורק אחר כך בוחרים טכנולוגיה.'
  ),
};

// ──────────────────────────────────────────────────────────── CONTACT

export interface ContactContent {
  hero: {
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
    lead: string;
  };
  whatsappNote: string;
  bookingNote: string;
  seo: SeoFields;
}

export const CONTACT_DEFAULT: ContactContent = {
  hero: {
    eyebrow: 'צור קשר',
    headlineLine1: 'בואו נבין איפה',
    headlineLine2: 'העסק שלכם תקוע.',
    lead: 'אתם לא צריכים להגיע עם תוכניות מוגדרות מראש או להבין בקוד. פשוט ספרו לנו מה שואב לכם את הזמן היום, ואנחנו כבר נדאג לפתרון.',
  },
  whatsappNote: 'מעדיפים לדלג על הטופס? בכיף. לחצו כאן ונדבר ישר בוואטסאפ.',
  bookingNote: '30 דקות, בזום או בטלפון. בלי מצגות, בלי הכנה מצדכם, ובלי התחייבות.',
  seo: seoDefault(
    'צור קשר ותיאום שיחת היכרות | LAHAV AI',
    'תכתבו לנו איפה זה נתקע. שיחת היכרות של 30 דקות, או פשוט השאירו פרטים ונחזור אליכם.'
  ),
};

// ────────────────────────────────────────────────────────────── FAQ PAGE
//
// The hero above the question list. The list of questions itself lives
// in faq_items (real rows, full CRUD) -- see the FAQ section below.

export interface FaqPageContent {
  headlineLine1: string;
  headlineLine2: string;
  lead: string;
  seo: SeoFields;
}

export const FAQ_PAGE_DEFAULT: FaqPageContent = {
  headlineLine1: 'תכל\'ס,',
  headlineLine2: 'בלי סודות.',
  lead: 'מה שבעלי עסקים באמת שואלים לפני שיחה ראשונה. תשובות ישירות.',
  seo: seoDefault(
    'שאלות נפוצות | LAHAV AI',
    'התשובות לשאלות שבעלי עסקים שואלים לפני שמתחילים: עלות, זמנים, מה קורה למידע, ואיך בכלל מתחילים.'
  ),
};

// ────────────────────────────────────────────────────────── NAVIGATION

export interface NavItemContent {
  key: string; // matches an href in site.ts NAV — never edited, only labels/enabled
  label: string;
  enabled: boolean;
}

export interface NavigationContent {
  items: NavItemContent[];
}

export const NAVIGATION_DEFAULT: NavigationContent = {
  items: NAV.map((n) => ({ key: n.href, label: n.label, enabled: true })),
};

// ──────────────────────────────────────────────────────────── FOOTER

export interface FooterContent {
  invitationLine1: string;
  /** WITHOUT a trailing period -- the template appends a separately
      styled "." span after this (see SiteFooter.astro's .ftr__dot). */
  invitationLine2: string;
  note: string;
  blurb: string;
}

export const FOOTER_DEFAULT: FooterContent = {
  invitationLine1: 'בואו נדבר על מה',
  invitationLine2: 'שתקוע',
  note: '30 דקות, בלי התחייבות.',
  blurb: 'הופכים תהליכים מתישים למערכות חכמות שעובדות בשבילכם.',
};

// ──────────────────────────────────────────────────── SERVICES INDEX PAGE
//
// Only SEO in this phase. The index page's own copy (the "what's stuck"
// chooser statements, the ghost word, ServiceStory's captions) is
// bespoke per-service framing embedded directly in the page and in
// ServiceStory.astro, not a predefined field -- see docs/WEBSITE_CMS.md
// for the reasoning. The five services' own name/lead/pain/points ARE
// editable, below.

export interface ServicesIndexContent {
  seo: SeoFields;
}

export const SERVICES_INDEX_DEFAULT: ServicesIndexContent = {
  seo: seoDefault(
    'השירותים שלנו | LAHAV AI',
    'חמישה תחומי שירות: מערכות CRM, אוטומציות עסקיות, פיתוח אתרים, פיתוח אפליקציות ויצירת תוכן באמצעות AI.'
  ),
};

// ─────────────────────────────────────────────────────────── SERVICES
//
// The slug, tone and featured flag are structural (which colour band, is
// it one of the two "primary" cards) and stay in code. Everything a
// visitor reads is editable here.

export interface ServiceContent {
  /** the big name at the top of the service's own page, AND the name
      shown on its card everywhere else (services index, mega menu,
      footer). One field: the same service should not have two names. */
  name: string;
  /** short label; not currently rendered anywhere in the approved
      design, kept for a predefined future use (breadcrumbs / tab
      titles) rather than exposed as a field that visibly does nothing. */
  short: string;
  /** the card blurb (services index, mega menu) -- DIFFERENT text from
      pageLead below, on purpose: SERVICES[].lead and SERVICE_PAGES[].lead
      were always two different sentences in the approved copy. */
  lead: string;
  pain: string;
  points: string[];
  h1a: string;
  h1b: string;
  /** the lead paragraph under h1a/h1b on the service's OWN page. */
  pageLead: string;
  symptomsTitle: string;
  symptoms: string[];
  buildTitle: string;
  build: { t: string; d: string }[];
  closing: string;
  closingBody: string;
  note: string;
  seo: SeoFields;
}

export const SERVICE_SLUGS = SERVICES.map((s) => s.slug) as readonly string[];

// The real per-page <title>/<meta description> each service page has
// shipped with (previously hardcoded in each src/pages/services/*.astro
// wrapper). These are NOT the same sentence as SERVICES[].lead -- each
// was written for its own page -- so they are listed explicitly rather
// than derived, to keep the migration byte-for-byte.
const SERVICE_SEO: Record<string, { title: string; description: string }> = {
  crm: {
    title: 'מערכות CRM חכמות | LAHAV AI',
    description: 'בונים מערכת CRM שמרכזת לקוחות, פניות ומשימות במקום אחד, ונותנת תמונה ברורה של כל לקוח ומה השלב הבא.',
  },
  automations: {
    title: 'אוטומציות עסקיות | LAHAV AI',
    description: 'מעבירים את הפעולות שחוזרות על עצמן למערכת שעושה אותן לבד, ומשאירים לכם את ההחלטות.',
  },
  'web-development': {
    title: 'פיתוח אתרים | LAHAV AI',
    description: 'אתרים עסקיים שנבנים סביב מטרה ומסלול ברור: מי נכנס, מה הוא מחפש, ולאן הוא אמור להגיע.',
  },
  'app-development': {
    title: 'פיתוח אפליקציות | LAHAV AI',
    description: 'תוכנה מותאמת לתהליך העסקי הספציפי שלכם, כשכלים קיימים פשוט לא מתאימים.',
  },
  'ai-content': {
    title: 'יצירת תוכן באמצעות AI | LAHAV AI',
    description: 'תהליך תוכן מסודר: מטרה עסקית, בריף, טיוטה בעזרת AI, בדיקה ואישור שלכם, ורק אז שימוש.',
  },
};

export function serviceDefault(slug: string): ServiceContent {
  const s = SERVICES.find((x) => x.slug === slug)!;
  const p = (SERVICE_PAGES as any)[slug];
  const seo = SERVICE_SEO[slug] ?? { title: `${s.name} | LAHAV AI`, description: s.lead };
  return {
    name: s.name,
    short: s.short,
    lead: s.lead,
    pain: s.pain,
    points: [...s.points],
    h1a: p.h1a,
    h1b: p.h1b,
    pageLead: p.lead,
    symptomsTitle: p.symptomsTitle,
    symptoms: [...p.symptoms],
    buildTitle: p.buildTitle,
    build: p.build.map((b: any) => ({ t: b.t, d: b.d })),
    closing: p.closing,
    closingBody: p.closingBody,
    note: p.note,
    seo: seoDefault(seo.title, seo.description),
  };
}

/**
 * Shapes a ServiceContent row into exactly the `data` prop
 * ServicePage.astro expects. `flow` and `viz` are NOT in ServiceContent
 * -- they are the diagram's own structural step labels and which
 * diagram to draw, and stay code-controlled in SERVICE_PAGES.
 */
export function toServicePageData(slug: string, content: ServiceContent) {
  const p = (SERVICE_PAGES as any)[slug];
  return {
    name: content.name,
    h1a: content.h1a,
    h1b: content.h1b,
    lead: content.pageLead,
    flow: p.flow,
    viz: p.viz,
    note: content.note,
    symptomsTitle: content.symptomsTitle,
    symptoms: content.symptoms,
    buildTitle: content.buildTitle,
    build: content.build,
    closing: content.closing,
    closingBody: content.closingBody,
  };
}

/**
 * The single published source for a service's display NAME, resolved for
 * every one of the 5 fixed slugs at once. Every place a service's name is
 * shown outside its own page -- the header mega menu, the mobile menu,
 * the footer's service list, the contact form's dropdown, the services
 * index cards, and the "other services" rail at the bottom of a service
 * page -- reads through this instead of the static `SERVICES` array, so
 * a renamed service cannot show two different names in two places
 * (2026-09-01, SOURCE_OF_TRUTH.md F-33/F-37).
 *
 * `preview` selects draft vs published, exactly like `getPublicContent`/
 * `getDraftContent` for a single page. A D1 failure on any one slug falls
 * back to that slug's own default name; it never blanks the others.
 */
export async function getServiceNames(
  services: ContentPageStore,
  preview: boolean
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const slug of SERVICE_SLUGS) {
    const def = serviceDefault(slug);
    out[slug] = preview
      ? await getDraftContent(services, slug, def).then((c) => c.name)
      : await getPublicContent(services, slug, def).then((c) => c.name);
  }
  return out;
}

// ──────────────────────────────────────────────────────────── PORTFOLIO
//
// "תיק עבודות" -- a growable list of EXAMPLE projects (client decision,
// 2026-09-01: entirely fictional business names, so nothing here implies
// a real client relationship). Not linked from navigation and not
// published by default -- see migrations/0010_portfolio.sql. Each item's
// content is one JSON blob stored in `portfolio_items` with the same
// draft/published split content_pages uses; `stores.portfolioList`
// handles everything content_pages never needed (create/list/delete/
// reorder/slug lookup) -- see PortfolioListStore in types.ts.

export interface PortfolioItemContent {
  /** used in the URL, /portfolio/<slug>/ -- changing it changes the address */
  slug: string;
  /** the fictional business name */
  name: string;
  /** short descriptor shown on the card and the page, e.g. "מסעדה", "קליניקת שיניים" */
  industry: string;
  /** which of LAHAV's services this example is about, free text, e.g. "CRM ואוטומציות" */
  service: string;
  /** one of the five fixed service slugs (SERVICE_SLUGS). Picks which
   *  detail-page layout and living diagram the project gets: a web build
   *  shows browser frames and the visitor journey, a CRM build shows the
   *  lead pipeline, and so on. '' falls back to the generic layout. */
  serviceSlug?: string;
  /** a media id from the `media` table, or '' for none */
  heroImage: string;
  /** optional: an https URL to an MP4/WebM that autoplays (muted, looped)
   *  in place of the image on the index tile and the detail hero. The
   *  media library is images-only and capped at 700KB (D1), so video has
   *  to be hosted elsewhere; heroImage doubles as its poster. */
  heroVideo?: string;
  /** optional one-liner shown under the name on the index tile */
  tagline?: string;
  /** optional: media ids of desktop screenshots of the built product,
   *  laid out on the detail page as two staggered columns */
  gallery?: string[];
  /** optional: media ids of phone-sized screenshots, shown as a
   *  horizontal strip of device frames on the detail page */
  mobileGallery?: string[];
  challenge: string;
  approach: string;
  result: string;
  seo: SeoFields;
}

/** The portfolio INDEX page's own hero + SEO -- a normal content_pages
 *  row (id: 'portfolio'), same mechanism as every other page. */
export interface PortfolioIndexContent {
  hero: { eyebrow: string; headlineLine1: string; headlineLine2: string; lead: string };
  seo: SeoFields;
}

export const PORTFOLIO_INDEX_DEFAULT: PortfolioIndexContent = {
  hero: {
    eyebrow: 'תיק עבודות',
    headlineLine1: 'דוגמאות לעבודה',
    headlineLine2: 'שאנחנו גאים בה.',
    lead: 'פרויקטים לדוגמה שממחישים איך אנחנו חושבים על מערכות ואוטומציה.',
  },
  seo: seoDefault(
    'תיק עבודות | LAHAV AI',
    'דוגמאות לפרויקטים: איך אנחנו הופכים בעיה עסקית למערכת שעובדת.'
  ),
};

// ────────────────────────────────────────────────────────────── FAQ

export interface FaqItemContent {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  enabled: boolean;
}

// ────────────────────────────────────────────────────── GLOBAL SETTINGS
//
// Reusable business facts. NEVER put a secret in this list — this table
// is readable and writable from the admin UI by design, and its values
// may end up rendered directly on the public site.
// `site_name` was deliberately removed from this list, 2026-09-01
// (SOURCE_OF_TRUTH.md F-36): LAHAV AI is a protected business identity,
// not something that should be casually renamed from the admin. A field
// that existed but was wired nowhere is worse than not having it -- see
// docs/WEBSITE_CMS.md. `SITE.name` from site.ts remains the one place
// the business name is defined, exactly as before this CMS existed.
export const SETTINGS_KEYS = [
  'whatsapp_number',
  'whatsapp_message',
  'discovery_booking_url',
  'cta_primary_label',
] as const;
export type SettingsKey = (typeof SETTINGS_KEYS)[number];

export const SETTINGS_DEFAULT: Record<SettingsKey, string> = {
  whatsapp_number: WHATSAPP_HREF.match(/wa\.me\/(\d+)/)?.[1] ?? '',
  whatsapp_message: decodeURIComponent(WHATSAPP_HREF.split('text=')[1] ?? ''),
  discovery_booking_url: DISCOVERY_BOOKING_URL,
  cta_primary_label: CTA_PRIMARY.label,
};

/** Builds the wa.me link from whatever is currently in settings (or the
 *  code defaults), so a WhatsApp number/message edit in Settings takes
 *  effect everywhere this is called instead of only where WHATSAPP_HREF
 *  from site.ts is imported directly. */
export function buildWhatsappHref(settings: Record<string, string>): string {
  const number = settings.whatsapp_number || SETTINGS_DEFAULT.whatsapp_number;
  const message = settings.whatsapp_message ?? SETTINGS_DEFAULT.whatsapp_message;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Per-key validation for settings writes. Most of these values end up in
 * an `href` on the public site (WhatsApp link, booking link), which Astro
 * does NOT escape the way it escapes text content -- a `javascript:` URL
 * saved here would actually execute when a visitor clicks it. This is the
 * enforced half of that: the write is rejected, not merely sanitized, so
 * a bad value never reaches the database in the first place.
 */
export function validateSettingValue(key: string, value: string): string | null {
  if (key === 'whatsapp_number') {
    return /^\d{7,15}$/.test(value) ? null : 'מספר וואטסאפ חייב להיות ספרות בלבד (7-15), בפורמט בינלאומי בלי + או רווחים.';
  }
  if (key === 'discovery_booking_url') {
    try {
      const u = new URL(value);
      return u.protocol === 'https:' ? null : 'הקישור חייב להתחיל ב-https://.';
    } catch {
      return 'הקישור אינו תקין.';
    }
  }
  return null; // whatsapp_message / cta_primary_label: free text, length-capped by the caller
}

export const SETTINGS_LABELS: Record<SettingsKey, string> = {
  whatsapp_number: 'מספר וואטסאפ (בינלאומי, בלי + או רווחים)',
  whatsapp_message: 'הודעת פתיחה בוואטסאפ',
  discovery_booking_url: 'קישור לקביעת שיחת היכרות',
  cta_primary_label: 'טקסט כפתור הפעולה הראשי',
};

// ─────────────────────────────────────────────────── the public resolver
//
// Merge is SHALLOW BY DESIGN and only at the top level of known objects:
// a key present in the stored JSON overrides the default; a key that is
// missing, null, or the wrong type falls back rather than producing
// `undefined` on the page. This means a malformed or partial save can
// never blank a field that already had approved content.
function mergeShallow<T extends Record<string, any>>(fallback: T, stored: any): T {
  if (!stored || typeof stored !== 'object') return fallback;
  const out: any = { ...fallback };
  for (const k of Object.keys(fallback)) {
    const v = (stored as any)[k];
    if (v === undefined || v === null) continue;
    if (
      typeof fallback[k] === 'object' &&
      !Array.isArray(fallback[k]) &&
      fallback[k] !== null &&
      typeof v === 'object' &&
      !Array.isArray(v)
    ) {
      out[k] = { ...fallback[k], ...v };
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Read one page's content for the PUBLIC site: published only, safely
 * merged onto the known-good default. Never throws — a D1 failure logs
 * and returns the default, which is the last approved copy baked into
 * this file, so the page still renders correctly.
 */
export async function getPublicContent<T extends Record<string, any>>(
  store: ContentPageStore,
  id: string,
  fallback: T
): Promise<T> {
  try {
    const raw = await store.getPublishedRaw(id);
    if (!raw) return fallback;
    return mergeShallow(fallback, JSON.parse(raw));
  } catch (err) {
    console.error(`[cms] failed to load published content "${id}":`, err);
    return fallback;
  }
}

/** Same, but reads the draft — used only by admin preview, after the
 *  caller has independently verified the request is from a signed-in
 *  admin/editor. This function performs no auth check itself. */
export async function getDraftContent<T extends Record<string, any>>(
  store: ContentPageStore,
  id: string,
  fallback: T
): Promise<T> {
  try {
    const raw = await store.getDraftRaw(id);
    if (!raw) return fallback;
    return mergeShallow(fallback, JSON.parse(raw));
  } catch (err) {
    console.error(`[cms] failed to load draft content "${id}":`, err);
    return fallback;
  }
}
