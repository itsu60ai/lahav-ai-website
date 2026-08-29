// Shared site constants. Single source so nothing drifts between the header,
// footer and page CTAs. Values here are either approved facts (F-11, F-15)
// or literal approved copy (APPROVED_COPY.md) — never invented.

export const SITE = {
  name: 'LAHAV AI',
  // F-15: brand, not a registered entity. Never add a company number,
  // registered office or physical address here.
  legalLine: 'Ethan Lahav · LAHAV AI',
};

// Primary nav (APPROVED_COPY.md), with מאמרים removed per D-Q3: no real
// approved articles exist yet, so the entry point is hidden rather than
// shown empty. Re-add once O-6 (launch articles) is resolved.
export const NAV = [
  { href: '/', label: 'בית' },
  { href: '/services/', label: 'שירותים' },
  { href: '/about/', label: 'אודות' },
  { href: '/contact/', label: 'צור קשר' },
] as const;

export const CTA_PRIMARY = {
  label: 'קביעת שיחת Discovery',
  href: '/contact/',
};

// F-11: approved secondary contact. Israeli number 054-696-9503 in
// international format for the wa.me link, with the approved opening
// message. No persistent floating button anywhere (D-Q2) — this link is
// placed contextually (hero, closing band, footer, contact page).
const WHATSAPP_NUMBER_INTL = '972546969503';
const WHATSAPP_MESSAGE = 'היי, הגעתי דרך האתר של LAHAV AI ואשמח לשמוע פרטים.';

export const WHATSAPP_HREF =
  `https://wa.me/${WHATSAPP_NUMBER_INTL}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

// The five approved services (R7 / F-2). Exactly five. Chatbots are never a
// sixth entry — see SOURCE_OF_TRUTH.md §5.1. CRM and Automations are
// featured (D-1, F-2) and get the editorial treatment on Home; the other
// three are presented as a compact list, not additional cards.
export const SERVICES = [
  {
    slug: 'crm',
    name: 'מערכות CRM חכמות',
    featured: true,
    blurb: 'מערכות שמרכזות לידים, לקוחות, מכירות ומשימות במקום אחד ברור — במקום חמישה כלים מנותקים.',
  },
  {
    slug: 'automations',
    name: 'אוטומציות עסקיות',
    featured: true,
    blurb: 'חיבור בין מערכות ותהליכים כדי לצמצם עבודה ידנית, טעויות ומעקב שנופל בין הכיסאות.',
  },
  {
    slug: 'web-development',
    name: 'פיתוח אתרים',
    featured: false,
    blurb: 'אתרים עסקיים שנבנים סביב מטרה ברורה, מבנה נכון ותהליך המרה — לא רק שכבה ויזואלית.',
  },
  {
    slug: 'app-development',
    name: 'פיתוח אפליקציות',
    featured: false,
    blurb: 'תוכנה מותאמת לתהליך העסקי הספציפי, כשיש צורך אמיתי שכלים מדף המדף לא פותרים.',
  },
  {
    slug: 'ai-content',
    name: 'יצירת תוכן באמצעות AI',
    featured: false,
    blurb: 'תהליך תוכן מובנה: יעד עסקי, בריף, טיוטת AI, בדיקה אנושית, ואז פרסום — לא פרסום אוטומטי.',
  },
] as const;

// Delivery journey (WEBSITE_PRD §7 Home; matches the Stitch structural
// reference). Six stages, RTL-ordered.
export const PROCESS = [
  { n: 1, label: 'אפיון' },
  { n: 2, label: 'תכנון' },
  { n: 3, label: 'הקמה' },
  { n: 4, label: 'בדיקות' },
  { n: 5, label: 'הטמעה' },
  { n: 6, label: 'מסירה' },
] as const;
