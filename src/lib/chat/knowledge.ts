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
  'איך זה חוסך לי כסף?',
  'איזה שירות מתאים לי?',
  'איך מתחילים?',
  'רוצה לקבוע שיחה קצרה',
] as const;

// ─────────────────────────────────────────── suggested follow-ups
//
// After every answer the panel offers two or three next questions. They
// are chosen by a keyword table, NOT by a second model call: a follow-up
// chip must cost nothing and must never be able to invent a claim, so
// every string below is written here by hand.
//
// Matching is on the visitor's own words first, then on the reply.

interface FollowUpRule {
  /** any one of these substrings in the text selects this rule */
  match: readonly string[];
  questions: readonly string[];
}

const FOLLOW_UP_RULES: readonly FollowUpRule[] = [
  {
    match: ['מחיר', 'עולה', 'עלות', 'תקציב', 'כמה כסף', 'תמחור'],
    questions: ['מה קורה בשיחת ההיכרות?', 'איך בונים הצעה לעסק שלי?', 'רוצה שתחזרו אליי'],
  },
  {
    match: ['כמה זמן', 'לוח זמנים', 'מתי יהיה', 'תוך כמה'],
    questions: ['איך נראה תהליך העבודה?', 'מה מוכן ראשון?', 'רוצה שתחזרו אליי'],
  },
  {
    match: ['crm', 'לקוחות', 'לידים', 'פניות', 'ניהול לקוחות'],
    questions: ['מה זה CRM בעצם?', 'איך זה מתחבר לוואטסאפ ולאימייל?', 'איזה שירות מתאים לי?'],
  },
  {
    match: ['אוטומצי', 'תהליך ידני', 'אקסל', 'חוזר על עצמו', 'לחסוך זמן'],
    questions: ['מה אפשר לאוטמט אצלי?', 'איך מתחילים אוטומציה?', 'איזה שירות מתאים לי?'],
  },
  {
    match: ['אתר', 'לנדינג', 'דף נחיתה', 'עיצוב אתר'],
    questions: ['מה כולל אתר כזה?', 'איך אתר מביא פניות?', 'איך מתחילים?'],
  },
  {
    match: ['אפליקצי', 'מובייל', 'אנדרואיד', 'אייפון'],
    questions: ['מתי בכלל צריך אפליקציה?', 'איך נראה תהליך העבודה?', 'איזה שירות מתאים לי?'],
  },
  {
    match: ['תוכן', 'פוסט', 'סושיאל', 'מאמר', 'ניוזלטר'],
    questions: ['איך יוצרים תוכן עם AI?', 'זה מתאים לעסק שלי?', 'איך מתחילים?'],
  },
  {
    match: ['תהליך', 'איך עובדים', 'אפיון', 'שלבים'],
    questions: ['מה קורה בשיחת ההיכרות?', 'מה צריך להכין מראש?', 'איזה שירות מתאים לי?'],
  },
  {
    match: ['שיחה', 'פגישה', 'לתאם', 'לקבוע', 'ליצור קשר'],
    questions: ['מה קורה בשיחת ההיכרות?', 'רוצה שתחזרו אליי', 'איזה שירות מתאים לי?'],
  },
];

/** Shown when nothing matches. Safe on any page and after any answer. */
const DEFAULT_FOLLOW_UPS = [
  'איזה שירות מתאים לי?',
  'איך מתחילים?',
  'רוצה שתחזרו אליי',
] as const;

/**
 * Two or three next questions, chosen deterministically from the last
 * exchange. No model call, no network, no cost.
 */
export function followUps(userText: string, replyText: string): string[] {
  const primary = String(userText ?? '').toLowerCase();
  const secondary = String(replyText ?? '').toLowerCase();
  const picked: string[] = [];

  const collect = (haystack: string) => {
    for (const rule of FOLLOW_UP_RULES) {
      if (picked.length >= 3) return;
      if (!rule.match.some((m) => haystack.includes(m))) continue;
      for (const q of rule.questions) {
        if (picked.length >= 3) break;
        if (!picked.includes(q)) picked.push(q);
      }
    }
  };

  collect(primary);
  if (picked.length < 2) collect(secondary);
  for (const q of DEFAULT_FOLLOW_UPS) {
    if (picked.length >= 3) break;
    if (!picked.includes(q)) picked.push(q);
  }
  return picked.slice(0, 3);
}

// ─────────────────────────────────────────── "call me back" intent
//
// Deliberately dumb and deterministic. A model call to classify intent
// would cost money on every message and could be talked into anything;
// a fixed Hebrew keyword list cannot. A false negative just means the
// visitor uses the button, which is always on screen anyway.
const LEAD_INTENT_WORDS = [
  'תחזרו אליי',
  'תחזרו אלי',
  'שתחזרו',
  'נחזור אליכם',
  'לחזור אליי',
  'לחזור אלי',
  'תתקשרו',
  'להתקשר',
  'רוצה שיחה',
  'לקבוע שיחה',
  'לתאם שיחה',
  'לקבוע פגישה',
  'לתאם פגישה',
  'שיחת היכרות',
  'ליצור קשר',
  'להשאיר פרטים',
  'הצעת מחיר',
  'מעוניין להתחיל',
  'מעוניינת להתחיל',
  'רוצה להתחיל',
] as const;

/** true when the exchange reads like the visitor wants to be contacted */
export function wantsCallback(userText: string, replyText: string): boolean {
  const hay = `${String(userText ?? '')} ${String(replyText ?? '')}`.toLowerCase();
  return LEAD_INTENT_WORDS.some((w) => hay.includes(w));
}
