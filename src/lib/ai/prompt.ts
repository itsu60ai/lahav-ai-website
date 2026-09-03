// Assembles the prompt text. PURE TEXT ASSEMBLY: no network call, no API
// key, no provider import. This file works identically regardless of
// provider mode, which is what makes it reusable unchanged in Stage B
// (paste into a subscription) and Stage D (call an API) — see
// docs/AI_ENGINE.md section 3.1.
//
// Render order matters for future prompt caching (docs/AI_ENGINE.md,
// section 3 tier 1): stable content first (style guide, truth rules),
// volatile content last (the brief).
import type { Article, Brief, Opportunity, Rule } from './types.ts';
import { CONTENT_KIND_LABELS } from './types.ts';

// Condensed from docs/COPY_STYLE.md. Keep in sync with that document if it
// changes; this is a summary for the prompt, not a replacement for it.
const STYLE_GUIDE = `
איך לכתוב: עברית ישראלית מדוברת, לא עברית רשמית.

זו ההוראה הכי חשובה כאן. הטקסט צריך להישמע כמו בעל עסק ישראלי שמסביר משהו
לחבר בשיחה, לא כמו מאמר בעיתון ולא כמו מסמך של רואה חשבון. אם משפט נשמע
כאילו הוקרא בחדשות, הוא נכשל.

מילים וביטויים אסורים לחלוטין (עברית רשמית שאף אחד לא מדבר):
מהווה, הינו, הינה, אשר, בכדי, לפיכך, כמו כן, יתרה מזאת, בנוסף לכך, לאור זאת,
על מנת, כאמור, יש לציין, ראוי לציין, בהתאם לכך, נוכח העובדה, במסגרת זו,
מגוון רחב של, פתרונות מתקדמים, בעולם של היום, בואו נצלול, חשוב לציין ש.

מילים וביטויים שכן: אז, בקיצור, תכל'ס, בפועל, בסוף, בגדול, נגיד, בוא נגיד,
זה אומר, מה שקורה זה, הקטע הוא, פשוט, בדיוק, בעצם, שווה, כדאי, נשמע מוכר.

איך משפט ישראלי נשמע:
רע (רשמי): "יש לבחון את התהליך בטרם הטמעתו במערכת הארגונית."
טוב (ישראלי): "לפני שמכניסים את זה למערכת, שווה לבדוק את זה על משהו קטן."
רע: "הכלי מהווה פתרון יעיל לאתגר זה."
טוב: "הכלי הזה פותר את זה יפה. עם כוכבית אחת."
רע: "בעולם העסקי של היום, אוטומציה הינה כלי מרכזי."
טוב: "כל עסק קטן מגיע לרגע שבו יש יותר מדי דברים לזכור."

כללי כתיבה:
- פנייה תמיד בלשון רבים: אתם, שלכם. אף פעם לא אתה ביחיד.
- גוף ראשון רבים עתיד למה שעושים ביחד: נשב, נבין, נבנה, נחבר.
- משפטים קצרים. הרבה מהם. אחר כך משפט אחד ארוך שמסביר. זה הקצב.
- מותר ורצוי משפט קטוע בלי פועל. "פשוט ככה." "וזהו." "בלי דרמה."
- מותר לפנות ישירות לקורא באמצע: "נשמע מוכר?", "כן, גם אצלכם."
- קונקרטי תמיד: משימה אמיתית שמזהים (תזכורת ללקוח, העברת פרטים מוואטסאפ
  לאקסל), לא מילה מופשטת כמו "תהליכים" או "התייעלות".
- כותרות משנה בשפה מדוברת, לא כותרות של דוח. "אז מה עושים עם זה" עדיף על
  "יישום מעשי".
- אסור מקף ארוך. אסור מילים באנגלית בתוך משפט עברי (חוץ מ-AI ו-CRM).
- אסור לכתוב על עצם הכתיבה ("כפי שציינו", "במאמר זה נסקור").
- אסור כמתים שגויים כמו "כל שני עסק קטן" או "כל שלישי בעל עסק" (תרגום
  מילולי שגוי מאנגלית). כותבים "הרבה בעלי עסקים קטנים" או "כמעט כל עסק
  קטן", לא מספר סידורי מומצא.
- כל כותרת משנה חייבת להיות ספציפית לנושא הממשי של הכתבה הזו, לא כותרת
  גנרית שיכולה להתאים לכל כתבה אחרת. אם הכתבה עוסקת בסוכני AI, אסור
  כותרת כמו "לפני שמתקינים כלום" שמדברת על התקנת תוכנה, זה נושא אחר
  לגמרי. תבדקו כל כותרת: האם היא באמת מתארת את מה שכתוב בפסקה שאחריה?

בדיקה אחרונה לפני שמסיימים: תקראו את הטקסט בקול. אם יש משפט אחד שלא
הייתם אומרים ככה לחבר בטלפון, תכתבו אותו מחדש.
`.trim();

// Condensed from the F-1..F-18 decisions and the truth rules already
// enforced across the site. This is the input half; gates.ts is the
// enforced, code-level half — a model ignoring this text is still caught.
const TRUTH_RULES = `
כללי אמת מחייבים:
- אין להמציא מספרים, אחוזים, כמויות, זמן שנחסך, או תוצאות. כל טענה כמותית
  חייבת להיות מבוססת על המקור שסופק, אחרת יש לנסח באופן איכותני בלבד.
- אין להמציא ותק, השכלה, תעודות, לקוחות, הכנסות או קרדיטים.
- אין טענות מקצועיות בלתי מבוססות לגבי ספקים או פלטפורמות חיצוניות.
- אין כתובת פיזית, מספר חברה או פרטי התאגדות.
- אין מקף ארוך (—) בשום מקום בטקסט.
- במאמר מגמה (trend): יש להפריד בבירור בין עובדה מאומתת (מקור מצוטט),
  פרשנות, והמלצה. אין להציג פרשנות כעובדה.
`.trim();

function opportunityBlock(o: Opportunity | null): string {
  if (!o) return '';
  return `
הזדמנות המקור לכתבה:
מקור: ${o.sourceName} (${o.sourceUrl})
תאריך פרסום: ${o.publishedAt ?? 'לא ידוע'}
מה בדיוק חדש: ${o.headline}
תקציר: ${o.summary}
סטטוס אימות: ${o.verification}${o.verificationNote ? ` — ${o.verificationNote}` : ''}
זווית מוצעת: ${o.suggestedAngle}
`.trim();
}

function examplesBlock(examples: Article[]): string {
  if (examples.length === 0) return '';
  const rendered = examples
    .slice(0, 2)
    .map(
      (a, i) => `דוגמה ${i + 1} (מאמר מאושר ומפורסם):
כותרת: ${a.title}
פתיח: ${a.standfirst}
`
    )
    .join('\n');
  return `דוגמאות לכתיבה טובה מהאתר עצמו:\n${rendered}`.trim();
}

function rulesBlock(rules: Rule[]): string {
  if (rules.length === 0) return '';
  const lines = rules.map((r) => `- ${r.ruleText}`).join('\n');
  return `כללים שנלמדו מעריכות קודמות שלך (ניתן למחוק כלל שגוי במסך הכללים):\n${lines}`;
}

function briefBlock(brief: Brief): string {
  return `
המשימה:
נושא: ${brief.topic}
מטרה: ${brief.goal}
קהל יעד: ${brief.audience}
סוג תוכן: ${CONTENT_KIND_LABELS[brief.contentKind]}
שירות רלוונטי: ${brief.serviceSlug || 'ללא'}
הערות נוספות: ${brief.notes || 'אין'}
`.trim();
}

export function assemblePrompt(args: {
  brief: Brief;
  opportunity: Opportunity | null;
  examples: Article[];
  rules: Rule[];
}): string {
  const parts = [
    STYLE_GUIDE,
    TRUTH_RULES,
    examplesBlock(args.examples),
    rulesBlock(args.rules),
    opportunityBlock(args.opportunity),
    briefBlock(args.brief),
  ].filter(Boolean);
  return parts.join('\n\n---\n\n');
}
