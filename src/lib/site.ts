// Shared site constants. Single source so nothing drifts between the header,
// footer and page CTAs. Values here are either approved facts (F-11, F-15)
// or literal approved copy (APPROVED_COPY.md), never invented.
//
// COPY RULE: the em dash character is banned project-wide. Use a hyphen,
// comma, colon, period, or rewrite the sentence.

export const SITE = {
  name: 'LAHAV AI',
  // F-15: brand, not a registered entity. Never add a company number,
  // registered office or physical address here.
  legalLine: 'Ethan Lahav · LAHAV AI',
};

export const CTA_PRIMARY = {
  label: 'קביעת שיחת Discovery',
  href: '/contact/',
};

// F-11: approved secondary contact. Israeli number 054-696-9503 in
// international format for the wa.me link, with the approved opening
// message. No persistent floating button anywhere (D-Q2), this link is
// placed contextually only.
const WHATSAPP_NUMBER_INTL = '972546969503';
const WHATSAPP_MESSAGE = 'היי, הגעתי דרך האתר של LAHAV AI ואשמח לשמוע פרטים.';

export const WHATSAPP_HREF =
  `https://wa.me/${WHATSAPP_NUMBER_INTL}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

// The five approved services (R7 / F-2). Exactly five, never a sixth.
// `pain` says which everyday business problem the service answers, so each
// one is understandable at a glance without technical language.
export const SERVICES = [
  {
    slug: 'crm',
    name: 'מערכות CRM חכמות',
    featured: true,
    lead: 'כל הלקוחות, הלידים והמשימות במקום אחד',
    pain: 'היום המידע מפוזר בין וואטסאפ, מייל, אקסל וראש של מישהו. אנחנו בונים מערכת אחת שרואה הכל, ויודעת מה השלב הבא של כל לקוח.',
  },
  {
    slug: 'automations',
    name: 'אוטומציות עסקיות',
    featured: true,
    lead: 'הפעולות הקטנות שגוזלות לכם את היום, קורות לבד',
    pain: 'העתקת פרטים בין מערכות, הודעות מעקב, תזכורות, עדכון טבלאות. במקום לעשות את זה ביד כל יום, המערכת עושה את זה בשבילכם.',
  },
  {
    slug: 'web-development',
    name: 'פיתוח אתרים',
    featured: false,
    lead: 'אתר שמביא פניות, לא רק נראה טוב',
    pain: 'אתר עסקי שבנוי סביב מטרה ברורה, ומחובר לתהליך שקורה אחרי שמישהו משאיר פרטים.',
  },
  {
    slug: 'app-development',
    name: 'פיתוח אפליקציות',
    featured: false,
    lead: 'כשמה שקיים בשוק פשוט לא מתאים',
    pain: 'תוכנה שנבנית סביב התהליך הספציפי שלכם, במקום לכופף את העסק לכלי שלא נבנה בשבילו.',
  },
  {
    slug: 'ai-content',
    name: 'יצירת תוכן באמצעות AI',
    featured: false,
    lead: 'תוכן עסקי בקצב סביר, בלי לוותר על שליטה',
    pain: 'תהליך מסודר: מטרה עסקית, בריף, טיוטה בעזרת AI, ואז בדיקה ואישור שלכם לפני שמשהו מתפרסם.',
  },
] as const;

// Primary nav (APPROVED_COPY.md). מאמרים stays hidden per D-Q3 until real
// approved articles exist (O-6). Services carries a dropdown of the five.
export const NAV = [
  { href: '/', label: 'בית' },
  { href: '/services/', label: 'שירותים', children: SERVICES },
  { href: '/about/', label: 'אודות' },
  { href: '/contact/', label: 'צור קשר' },
] as const;

// Delivery journey (WEBSITE_PRD §7 Home). Six stages, RTL-ordered.
// `what` is written for a business owner, not a project manager.
export const PROCESS = [
  { n: 1, label: 'אפיון', what: 'יושבים, מבינים איך העסק עובד היום ואיפה נתקע' },
  { n: 2, label: 'תכנון', what: 'מחליטים מה נבנה, באיזה סדר, ומה נשאר לשלב הבא' },
  { n: 3, label: 'הקמה', what: 'בונים את המערכת ומחברים בין החלקים' },
  { n: 4, label: 'בדיקות', what: 'עוברים על התהליכים ומוודאים שהכל עובד כמו שצריך' },
  { n: 5, label: 'הטמעה', what: 'מעבירים את הצוות למערכת החדשה, בלי לעצור את העסק' },
  { n: 6, label: 'מסירה', what: 'אתם מקבלים מערכת שאתם יודעים לתפעל לבד' },
] as const;
