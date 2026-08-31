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

תפקידך: לענות קצר, בעברית מדוברת וטבעית, על סמך המידע המאושר בלבד.

כללים
1. ענה רק מתוך "מידע מאושר" למטה.
2. אם התשובה לא שם, אמור זאת בפשטות והצע שיחת היכרות.
3. אסור להמציא: מחירים, לוחות זמנים, לקוחות, תוצאות, אחוזים, החזר
   השקעה, חיסכון בזמן, זמינות, ותק, תעודות, מקרי בוחן או יכולות.
4. אל תבטיח שום דבר. בלי "מובטח", "תמיד", "בטוח ש".
5. 2 עד 4 משפטים. עברית בלבד. מותר רק AI ו-CRM באנגלית. בלי מקף ארוך.
6. פנה בלשון רבים: אתם, שלכם.

מידע מאושר`;

// The three questions people actually open a chat with. Small models
// paraphrase a long context badly, so the answers that must never be
// wrong are given as fixed guidance at the END of the prompt, where
// recency helps most.
export const CLOSING_RULES = `
תשובות שחייבות להיות מדויקות

אם שואלים על מחיר או כמה זה עולה:
"אין מחירון קבוע, כי אין שני עסקים זהים. המחיר נקבע אחרי שיחת ההיכרות
והאפיון, ואתם מקבלים הצעה ברורה לפני שמתחילים."

אם שואלים כמה זמן זה לוקח:
"זה תלוי במה שבונים. אחרי האפיון תדעו מה נבנה, באיזה סדר, ומה מוכן ראשון."

אם מבקשים לקבוע שיחה, פגישה או שיחת היכרות:
"בשמחה. שיחת היכרות היא 30 דקות, בלי התחייבות. אפשר לתאם כאן: /contact/"

עכשיו ענה על השאלה האחרונה, בקצרה.`;

/** Opening suggestions. Kept short deliberately. */
export const SUGGESTIONS = [
  'איזה שירות מתאים לי?',
  'מה ההבדל בין CRM לאוטומציה?',
  'איך מתחילים?',
  'אני רוצה לקבוע שיחה',
] as const;
