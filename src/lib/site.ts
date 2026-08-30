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

// F-14 / F-17: approved founder identity. The photo is the client's own
// supplied asset. It must never be AI generated or materially altered;
// cropping, compression and responsive sizing are the only edits allowed.
//
// photoReady stays false until the real file exists at `photo`. While it is
// false the About block renders an intentional branded placeholder rather
// than a broken image or a stock stand-in.
export const FOUNDER = {
  name: 'איתן להב',
  role: 'Founder & AI Systems Builder',
  photo: '/founder/ethan-lahav.jpg',
  photoSmall: '/founder/ethan-lahav-480.jpg',
  photoReady: true,
  alt: 'איתן להב, מייסד LAHAV AI',
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
    lead: 'הלקוחות, הלידים והמשימות במקום אחד',
    pain: 'היום המידע מפוזר בין וואטסאפ, מייל, אקסל וראש של מישהו. אנחנו בונים מערכת שמרכזת את המידע החשוב ונותנת תמונה ברורה של כל לקוח ומה צריך לקרות עכשיו.',
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
    lead: 'אתר שבנוי להוביל אנשים לפעולה, לא רק להיראות טוב',
    pain: 'מתחילים ממטרה עסקית ברורה: מי נכנס לאתר, מה הוא מחפש, ולאן הוא אמור להגיע. משם בונים את המבנה, התוכן, הטפסים והחיבור לתהליך שקורה אחרי שמישהו משאיר פרטים.',
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

// B4 (PRD): the capabilities LAHAV AI genuinely works with, expressed as
// disciplines and system types only. No vendor, platform, framework or API
// name appears here or anywhere public until each one is separately
// verified (PL-16). Course curriculum is a training roadmap, never a
// public capability claim (client decision, 2026-08-30).
export const CAPABILITIES = [
  'ניהול לקוחות ולידים',
  'אוטומציה של תהליכים ומשימות',
  'טפסים וקליטת מידע',
  'חיבור בין תהליכים ומידע',
  'מערכות עסקיות מותאמות',
  'אתרים ואפליקציות סביב תהליך עסקי',
  'תהליכי תוכן בסיוע AI',
] as const;

// Delivery journey (WEBSITE_PRD §7 Home). Six stages, RTL-ordered.
// `what` is written for a business owner, not a project manager.
export const PROCESS = [
  { n: 1, label: 'אפיון', what: 'יושבים, מבינים איך העסק עובד היום ואיפה נתקע' },
  { n: 2, label: 'תכנון', what: 'מחליטים מה נבנה, באיזה סדר, ומה נשאר לשלב הבא' },
  { n: 3, label: 'הקמה', what: 'בונים את המערכת ומחברים בין החלקים' },
  { n: 4, label: 'בדיקות', what: 'עוברים על התהליכים ומוודאים שהכל עובד כמו שצריך' },
  { n: 5, label: 'הטמעה', what: 'מעבירים את הצוות לעבוד עם המערכת החדשה' },
  { n: 6, label: 'מסירה', what: 'אתם מקבלים מערכת שאתם יודעים לתפעל לבד' },
] as const;

// ---------------------------------------------------------------------
// Per service page content. Written against R9: no vendor names, no
// metrics, no guarantees, no integrations, no timelines.
// `viz` picks the bespoke visual from Viz.astro.
// ---------------------------------------------------------------------
export const SERVICE_PAGES = {
  crm: {
    viz: 'crm',
    eyebrow: 'מערכות CRM חכמות',
    h1: 'כל לקוח במקום אחד, עם שלב הבא ברור',
    lead: 'במקום לחפש מה נאמר ללקוח ומתי, ומי אמור לחזור אליו, הכל יושב במקום אחד שכולם עובדים איתו.',
    symptomsTitle: 'מתי עסק מרגיש שהוא צריך את זה',
    symptoms: [
      'לא ברור מי מטפל בפנייה ומה קרה איתה',
      'צריך לחפש בשיחות ובמיילים כדי להיזכר בפרטים',
      'לקוחות מחכים לחזרה שלא קורית',
      'קשה להגיד מה מצב המכירות החודש בלי לאסוף ידנית',
    ],
    buildTitle: 'מה בונים בפועל',
    build: [
      { t: 'מקום אחד לכל הפניות', d: 'כל פנייה נכנסת נרשמת עם הפרטים שחשובים לכם, בלי להעתיק ידנית.' },
      { t: 'תמונה ברורה של כל לקוח', d: 'מה סוכם, מה נשלח, מה פתוח, ומה השלב הבא.' },
      { t: 'מעקב שלא נופל', d: 'המערכת מזכירה מה מחכה לטיפול ומי צריך חזרה.' },
      { t: 'תמונת מצב לניהול', d: 'לראות מה קורה בעסק בלי לבנות דוח מאפס בכל פעם.' },
    ],
    closing: 'רוצים לראות איך זה נראה על העסק שלכם?',
    note: 'המבנה המדויק נקבע לפי איך שהעסק שלכם באמת עובד. התרשים הוא דוגמה להמחשה, לא מבנה קבוע.',
  },
  automations: {
    viz: 'automation',
    eyebrow: 'אוטומציות עסקיות',
    h1: 'הדברים הקטנים קורים לבד. אתם מחליטים מתי להתערב',
    lead: 'אוטומציה טובה לא מוציאה אתכם מהתמונה. היא לוקחת את הפעולות שחוזרות על עצמן, ומשאירה לכם את ההחלטות.',
    symptomsTitle: 'איפה זה עוזר',
    symptoms: [
      'העברת פרטים ממערכת למערכת',
      'הודעות מעקב שנשלחות אחרי כל פנייה',
      'תזכורות שתלויות בזיכרון של מישהו',
      'עדכון טבלאות ורשימות ידנית',
    ],
    buildTitle: 'איך אוטומציה נראית בפועל',
    build: [
      { t: 'קורה משהו', d: 'פנייה חדשה, תשלום, תאריך שמגיע, סטטוס שמשתנה.' },
      { t: 'המערכת בודקת מה נכון', d: 'לפי כללים שאתם מגדירים, לא לפי ניחוש.' },
      { t: 'הפעולה מתבצעת', d: 'הודעה נשלחת, רשומה מתעדכנת, משימה נפתחת.' },
      { t: 'ואם צריך אתכם', d: 'זה עובר אליכם להחלטה במקום לרוץ לבד.' },
    ],
    closing: 'יש תהליך חוזר שמתאים לאוטומציה?',
    note: 'הדוגמאות כאן מדגימות את הרעיון. מה בדיוק יאוטמט בעסק שלכם נקבע באפיון.',
  },
  'web-development': {
    viz: 'web',
    eyebrow: 'פיתוח אתרים',
    h1: 'אתר שיודע לאן הוא מוביל את המבקר',
    lead: 'אתר טוב הוא לא רק עיצוב יפה. הוא מסלול: מי נכנס, מה הוא מחפש, ולאן הוא אמור להגיע.',
    symptomsTitle: 'מה שואלים לפני שמעצבים',
    symptoms: [
      'מי המבקר ומה הוא מחפש כשהוא מגיע',
      'מה הפעולה שאנחנו רוצים שיעשה',
      'מה הוא צריך לדעת כדי להיות מוכן לפעולה הזו',
      'מה קורה בעסק אחרי שהוא משאיר פרטים',
    ],
    buildTitle: 'מה נכנס לעבודה',
    build: [
      { t: 'מבנה ומסלול', d: 'סדר העמודים והתוכן, כך שהמבקר תמיד יודע מה הצעד הבא.' },
      { t: 'תוכן שמסביר', d: 'ניסוח בשפה עסקית פשוטה, בלי ז׳רגון.' },
      { t: 'טפסים ונקודות כניסה', d: 'המקומות שבהם מבקר הופך לפנייה.' },
      { t: 'עבודה נכונה בנייד', d: 'אותו מסלול ואותה בהירות גם במסך קטן.' },
    ],
    closing: 'רוצים אתר שמוביל לפעולה?',
    note: 'אנחנו לא מבטיחים מיקומים בגוגל, כמות פניות או ביצועים מספריים. מה שכן, בונים את המסלול נכון.',
  },
  'app-development': {
    viz: 'app',
    eyebrow: 'פיתוח אפליקציות',
    h1: 'כשמה שקיים בשוק לא מתאים לתהליך שלכם',
    lead: 'לפעמים אין כלי מדף שמתאים לאיך שהעסק עובד. אז במקום לכופף את העסק לכלי, בונים כלי שמתאים לעסק.',
    symptomsTitle: 'מתי זה מוצדק',
    symptoms: [
      'התהליך שלכם ייחודי ואף כלי לא תומך בו כמו שצריך',
      'אתם משלמים על כמה כלים ועדיין עובדים באקסל',
      'הצוות עושה עקיפות ידניות כדי לגרום למערכת לעבוד',
      'יש משהו שחוזר כל יום ואין לו מקום מסודר',
    ],
    buildTitle: 'איך זה מתחיל',
    build: [
      { t: 'מתחילים מהצורך', d: 'מה בדיוק צריך לקרות, ומי צריך לעשות את זה.' },
      { t: 'ממפים את המסכים', d: 'מה רואים, מה מזינים, ומה קורה אחרי.' },
      { t: 'מגדירים את הפעולות', d: 'הכפתורים שבאמת צריך, בלי עומס מיותר.' },
      { t: 'בודקים על אנשים אמיתיים', d: 'מי שישתמש בזה עובר על זה לפני שממשיכים.' },
    ],
    closing: 'יש תהליך שאין לו כלי מתאים?',
    note: 'טכנולוגיות, פלטפורמות ואופן ההפצה נקבעים באפיון לפי הצורך, ולא מובטחים מראש.',
  },
  'ai-content': {
    viz: 'content',
    eyebrow: 'יצירת תוכן באמצעות AI',
    h1: 'תוכן בקצב סביר, בלי לוותר על שליטה',
    lead: 'AI יכול לקצר מאוד את הדרך מרעיון לטיוטה. מה שהוא לא אמור לעשות זה לפרסם בשמכם בלי שראיתם.',
    symptomsTitle: 'הבעיה המוכרת עם תוכן',
    symptoms: [
      'יודעים שצריך לכתוב, אף פעם אין לזה זמן',
      'כשכן כותבים, זה יוצא כללי מדי',
      'אין תהליך קבוע, אז זה קורה בהתקפים',
      'קשה לשמור על קול אחיד לאורך זמן',
    ],
    buildTitle: 'איך התהליך עובד',
    build: [
      { t: 'מתחילים ממטרה', d: 'למי כותבים ומה רוצים שיקרה אחרי הקריאה.' },
      { t: 'בריף קצר', d: 'נושא, זווית, ומה חייב להופיע.' },
      { t: 'טיוטה בעזרת AI', d: 'הדרך המהירה מדף ריק לטקסט שאפשר לעבוד איתו.' },
      { t: 'אתם קוראים ומאשרים', d: 'שום דבר לא יוצא החוצה לפני שאישרתם.' },
    ],
    closing: 'רוצים תהליך תוכן מסודר?',
    note: 'ההיקף המדויק של השירות הזה עדיין בהגדרה. הדף מציג את התפיסה, לא רשימת מוצר סופית.',
  },
} as const;

// ---------------------------------------------------------------------
// Articles. EMPTY on purpose: no real approved article exists yet (O-6 /
// F-8), and inventing one would break R9. The Articles nav link stays
// hidden while this is empty (D-Q3). The article template below is built
// and reviewable, driven by clearly labelled sample content.
// ---------------------------------------------------------------------
export const ARTICLES: readonly {
  slug: string;
  title: string;
  summary: string;
  date: string;
}[] = [];

// Sample used ONLY to render the article template for review. It is never
// published: the route is noindex and the page states it is a template.
export const ARTICLE_TEMPLATE_SAMPLE = {
  title: 'איך יודעים אם תהליך בעסק מתאים לאוטומציה',
  date: 'תבנית לדוגמה',
  readingNote: 'זו תבנית עיצוב, לא מאמר שפורסם',
};
