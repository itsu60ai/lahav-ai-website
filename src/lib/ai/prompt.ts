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
סגנון כתיבה (מתוך docs/COPY_STYLE.md):
- קול עברי, ישיר, לבעל עסק ללא רקע טכני. לא שיווקי-מתורגם.
- קונקרטי תמיד: דוגמה יומיומית מוכרת אחת לפחות בכל מקטע.
- משפטים קצרים וקטועים, ואז משפט אחד שמסביר.
- כותרות משנה משתנות בסגנון, לא נוסחה חוזרת.
- קריאות לפעולה הן הזמנה, לא שם עצם.
- אסור: שם ספק/פלטפורמה/פריימוורק בטקסט הפומבי, מספרים או תוצאות מומצאים,
  מילים באנגלית בתוך משפט עברי, ומקף ארוך (—) בכל מקום בטקסט.
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
