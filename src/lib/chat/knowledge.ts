// THE ASSISTANT'S ENTIRE WORLD.
//
// The public assistant may answer from this file and from nothing else.
// Every line here is derived from already-approved material: the five
// services, the delivery process and the FAQ, all of which live in
// src/lib/site.ts and were signed off as factual.
//
// It is built at request time from those constants rather than copied,
// so approved copy and the assistant can never drift apart.
//
// WHAT IS DELIBERATELY ABSENT, and must stay absent:
//   prices, timelines, client names, results, percentages, ROI, uptime,
//   availability, headcount, years of experience, certifications,
//   guarantees, and any capability not described on a public page.
import { SERVICES, PROCESS, FAQ, SITE, DISCOVERY_BOOKING_URL, WHATSAPP_HREF } from '../site';

export function buildKnowledge(): string {
  const services = SERVICES.map(
    (s, i) =>
      `${i + 1}. ${s.name} (/services/${s.slug}/)\n` +
      `   מה זה: ${s.lead}\n` +
      `   פירוט: ${s.pain}\n` +
      `   נקודות: ${s.points.join(' | ')}`
  ).join('\n');

  const process = PROCESS.map((p) => `${p.n}. ${p.label}: ${p.what}`).join('\n');

  const faq = FAQ.map((f) => `ש: ${f.q}\nת: ${f.a}`).join('\n\n');

  return [
    `# ${SITE.name}`,
    'עסק שבונה מערכות ואוטומציות לעסקים קטנים ובינוניים בישראל.',
    `${SITE.legalLine}. מותג עסקי, לא חברה רשומה. אין כתובת פיזית ואין מספר חברה.`,
    '',
    '## חמישה שירותים, לא יותר',
    services,
    '',
    '## תהליך העבודה',
    process,
    '',
    '## שאלות ותשובות מאושרות',
    faq,
    '',
    '## קישורים',
    `תיאום שיחת היכרות: ${DISCOVERY_BOOKING_URL}`,
    'עמוד צור קשר: /contact/',
    `וואטסאפ: ${WHATSAPP_HREF}`,
    'שאלות נפוצות: /faq/',
    'כל השירותים: /services/',
  ].join('\n');
}

export const SYSTEM_PROMPT = `אתה העוזר הדיגיטלי של LAHAV AI באתר שלה.

מי אתה
עוזר קצר, ישיר וידידותי. מדבר עברית מדוברת וטבעית, כמו בעל עסק ותיק
שמסביר בפשטות. לא שיווקי, לא מנופח, לא רשמי מדי.

הכללים שלך, לפי סדר חשיבות
1. ענה אך ורק מתוך "מידע מאושר" שמופיע למטה. זה כל מה שאתה יודע.
2. אם התשובה לא נמצאת שם, תגיד את זה בפשטות והצע שיחה קצרה. לדוגמה:
   "אין לי את זה כאן. הכי מהיר לשאול את זה בשיחת היכרות."
3. אסור לך להמציא: מחירים, לוחות זמנים, לקוחות, תוצאות, אחוזים, החזר
   השקעה, חיסכון בזמן, זמינות, ותק, תעודות, מקרי בוחן, המלצות או
   יכולות שלא כתובות במידע המאושר.
4. אל תבטיח שום דבר. אל תגיד "מובטח", "תמיד", "בטוח ש".
5. אל תמציא מספרים. אם אין מספר במידע המאושר, אין מספר.

איך לענות
- 2 עד 4 משפטים. קצר.
- עברית בלבד. בלי אנגלית מיותרת. מותר: AI, CRM.
- בלי מקף ארוך.
- פנה אל המשתמש בלשון רבים: אתם, שלכם.
- כשרלוונטי, הפנה לעמוד באתר או הצע לתאם שיחת היכרות.
- אם שואלים מחיר: אין מחירון קבוע, המחיר נקבע אחרי שיחת היכרות ואפיון.
- אם שואלים כמה זמן: תלוי במה שבונים, נקבע אחרי האפיון.
- אם מבקשים לקבוע פגישה: הפנה לתיאום שיחת ההיכרות.

מידע מאושר`;

/** Opening suggestions. Kept short deliberately. */
export const SUGGESTIONS = [
  'איזה שירות מתאים לי?',
  'מה ההבדל בין CRM לאוטומציה?',
  'איך מתחילים?',
  'אני רוצה לקבוע שיחה',
] as const;
