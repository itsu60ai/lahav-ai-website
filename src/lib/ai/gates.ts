// Quality gates. See docs/AI_ENGINE.md section 9 and the Stage B review
// UX rework (client feedback 2026-09-01).
//
// Every failure carries enough to build a real review card: a plain
// Hebrew headline, why it was flagged, the exact evidence, where it is,
// and what to do about it — not a raw internal gate id.
//
// Severity, not a single pass/fail:
//   blocking — withheld from publishing on the review page until resolved
//              (a genuine near-duplicate, content too thin to be usable).
//   review   — shown, actionable, does NOT withhold publishing (an
//              unverified number, a related-but-different existing
//              article, an incomplete SEO field, a missing diagram).
//   info     — background note only.
// This is what "human review is the default workflow" means concretely:
// a heuristic gate can be wrong, so only the clearest cases block.
import type { Article } from '../cms/types.ts';
import type { GateFailure, GateResult, GateSeverity, GeneratorOutput, Opportunity } from './types.ts';

const EM_DASH = '—';

function textOf(output: GeneratorOutput): string {
  const bodyText = output.body
    .map((b) => ('x' in b ? b.x : 'items' in b ? b.items.join(' ') : ''))
    .join(' ');
  return [output.title, output.standfirst, output.excerpt, bodyText].join(' ');
}

/** the full sentence containing a substring, for evidence quoting */
function sentenceContaining(text: string, needle: string): string {
  const sentences = text.split(/(?<=[.!?׃])\s+|\n+/);
  const hit = sentences.find((s) => s.includes(needle));
  return (hit ?? needle).trim().slice(0, 220);
}

function fail(
  gate: string,
  severity: GateSeverity,
  title: string,
  detail: string,
  extra: Partial<GateFailure> = {}
): GateFailure {
  return { gate, severity, title, detail, ...extra };
}

// ─────────────────────────────────────────────── em dash

function checkEmDash(output: GeneratorOutput): GateFailure[] {
  const body = textOf(output);
  const all = [body, output.seo.seoTitle, output.seo.metaDescription].join(' ');
  if (!all.includes(EM_DASH)) return [];
  return [
    fail(
      'em-dash',
      'review',
      'נמצא מקף ארוך (—) בטקסט',
      'מקף ארוך אסור בכלל בקופי של האתר, מטעמי סגנון קבוע.',
      {
        evidence: sentenceContaining(body, EM_DASH),
        location: 'בגוף הכתבה או בכותרת ה-SEO',
        suggestion: 'פתחו את המאמר לעריכה והחליפו את המקף בפסיק, נקודתיים, או פיצול למשפט נפרד.',
      }
    ),
  ];
}

// ─────────────────────────────────────────────── invented numbers

const YEAR_PATTERN = /^(19|20)\d{2}$/; // 1900–2099: near-always a date, never a flagged claim

/** true if this number is a plain year, or is embedded in an ISO date string */
function looksLikeDateOrYear(n: string, isoDates: string[]): boolean {
  if (YEAR_PATTERN.test(n)) return true;
  return isoDates.some((iso) => iso.includes(n));
}

/** A number/percentage that doesn't appear anywhere in the checked sources
 *  is flagged for human verification — never silently accepted, never
 *  silently blocked. Years, dates, and numbers that DO appear in a checked
 *  source are recognized correctly and never even reach this failure. */
function checkInventedNumbers(
  output: GeneratorOutput,
  opportunity: Opportunity | null,
  notes: string
): GateFailure[] {
  const body = textOf(output);
  const numberPattern = /\d+(\.\d+)?%?/g;
  const found = [...new Set(body.match(numberPattern) ?? [])];
  if (found.length === 0) return [];

  const isoDates = [opportunity?.publishedAt].filter((v): v is string => !!v);

  const sourceParts: { label: string; text: string }[] = [];
  if (opportunity) {
    sourceParts.push({ label: `המקור המצוטט (${opportunity.sourceName})`, text: [opportunity.headline, opportunity.summary, opportunity.whyItMatters].join(' ') });
  }
  if (notes) sourceParts.push({ label: 'ההערות שהוזנו לבריף', text: notes });
  for (const c of output.seo.citations) {
    sourceParts.push({ label: `המקור המצוטט (${c.label})`, text: `${c.label} ${c.url}` });
  }
  const sourceChecked = sourceParts.map((s) => s.label).join(', ') || 'לא סופק מקור לבדיקה';

  const failures: GateFailure[] = [];
  for (const n of found) {
    if (looksLikeDateOrYear(n, isoDates)) continue; // recognized correctly as a date/year, not a claim
    const foundInSource = sourceParts.some((s) => s.text.includes(n));
    if (foundInSource) continue; // recognized correctly as coming from an approved source

    failures.push(
      fail(
        'invented-numbers',
        'review',
        'נמצא מספר שדורש אימות',
        `המספר "${n}" מופיע בכתבה אך לא נמצא באף אחד מהמקורות שנבדקו. ייתכן שהוא תקין ופשוט מנוסח אחרת במקור, אך יש לבדוק זאת לפני פרסום — לפי הכלל הקבוע שלא ממציאים מספרים.`,
        {
          evidence: sentenceContaining(body, n),
          location: 'בגוף הכתבה',
          suggestion: 'פתחו את המאמר, אתרו את המשפט המצוטט, והשוו מול המקור. אם המספר נכון, נסחו אותו כך שיזוהה במקור (או הוסיפו קישור מפורש), ואז הריצו בדיקה מחדש. אם אינו נכון, ערכו או הסירו אותו.',
          meta: { matchedNumber: n, sourceChecked },
        }
      )
    );
  }
  return failures;
}

// ─────────────────────────────────────────────── duplicate topic

function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/["'׳״]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function tokenOverlapRatio(a: string, b: string): number {
  const ta = new Set(normalizeForCompare(a).split(/\s+/).filter((w) => w.length > 2));
  const tb = new Set(normalizeForCompare(b).split(/\s+/).filter((w) => w.length > 2));
  if (ta.size === 0 || tb.size === 0) return 0;
  const overlap = [...ta].filter((t) => tb.has(t)).length;
  return overlap / Math.min(ta.size, tb.size);
}

/** >=0.85 or an identical slug: a genuine duplicate, withheld from publish.
 *  0.7–0.85: related, worth a look, never withheld on its own. */
function checkDuplicateTopic(output: GeneratorOutput, existing: Article[]): GateFailure[] {
  let best: { article: Article; ratio: number } | null = null;
  for (const a of existing) {
    if (a.slug === output.seo.slug) {
      best = { article: a, ratio: 1 };
      break;
    }
    const ratio = tokenOverlapRatio(output.title, a.title);
    if (ratio >= 0.7 && (!best || ratio > best.ratio)) best = { article: a, ratio };
  }
  if (!best) return [];

  const isGenuine = best.ratio >= 0.85;
  return [
    fail(
      'duplicate-topic',
      isGenuine ? 'blocking' : 'review',
      isGenuine ? 'קיים כבר מאמר כמעט זהה' : 'קיים מאמר קרוב בנושא',
      isGenuine
        ? 'הכותרת והתוכן חופפים ברמה גבוהה מאוד למאמר קיים באתר. פרסום כפול עלול לבלבל קוראים ולפגוע ב-SEO.'
        : 'נמצא מאמר קיים שנוגע בנושא דומה, אך לא בהכרח זהה. שווה לבדוק אם מדובר בכפילות אמיתית או בזווית שונה שמצדיקה כתבה נפרדת.',
      {
        evidence: `מאמר קיים: "${best.article.title}"`,
        location: 'כותרת ותוכן הכתבה',
        suggestion: isGenuine
          ? 'פתחו את המאמר הקיים לבדוק אם באמת מדובר באותו נושא. אם כן, מומלץ לבטל את הטיוטה הזו או לשנות את הזווית באופן משמעותי. פרסום ייחסם עד לפתרון.'
          : 'פתחו את שני המאמרים והשוו. אם הנושא שונה בפועל, אפשר להמשיך כרגיל — זו רק הערה.',
        meta: {
          matchedArticleId: best.article.id,
          matchedArticleSlug: best.article.slug,
          matchedArticleTitle: best.article.title,
        },
      }
    ),
  ];
}

// ─────────────────────────────────────────────── SEO completeness

function checkSeoCompleteness(output: GeneratorOutput): GateFailure[] {
  const seo = output.seo;
  const missing: string[] = [];
  if (!seo.metaTitle) missing.push('meta title');
  if (!seo.metaDescription) missing.push('meta description');
  if (!seo.slug) missing.push('כתובת URL (slug)');
  if (!seo.primaryKeyword) missing.push('מילת מפתח ראשית');
  if (missing.length === 0) return [];
  return [
    fail(
      'seo-completeness',
      'review',
      'חבילת ה-SEO לא הושלמה במלואה',
      `השדות הבאים חסרים או הושלמו אוטומטית בערך זמני: ${missing.join(', ')}.`,
      {
        location: 'חבילת ה-SEO',
        suggestion: 'פתחו את המאמר לעריכה והשלימו את השדות החסרים, ואז הריצו בדיקה מחדש.',
      }
    ),
  ];
}

// ─────────────────────────────────────────────── image / visual

function checkImageCompleteness(output: GeneratorOutput): GateFailure[] {
  if (!output.visual) {
    return [
      fail('image-completeness', 'review', 'לא התקבל תרשים תקין למאמר', 'לא נמצאה תמונה כלל עבור הכתבה הזו.', {
        location: 'תמונת הכתבה',
        suggestion: 'ניתן ליצור תרשים חלופי, או להשתמש זמנית בתרשים ברירת המחדל של השירות.',
      }),
    ];
  }
  if (output.visual.source === 'mock') {
    return [
      fail(
        'image-completeness',
        'info',
        'משמש תרשים ברירת מחדל זמני',
        'התשובה שהודבקה לא כללה SVG תקין, כך שהופק תרשים ממותג זמני במקום תרשים ייחודי לכתבה.',
        {
          location: 'תמונת הכתבה',
          suggestion: 'אפשר להמשיך כך, או לחזור ל-AI ולבקש תרשים SVG בפורמט הנדרש ולהדביק מחדש.',
        }
      ),
    ];
  }
  if (!output.visual.altText?.trim()) {
    return [
      fail('image-completeness', 'review', 'טקסט חלופי (alt) חסר לתמונה', 'לתמונת הכתבה אין תיאור נגישות.', {
        location: 'תמונת הכתבה',
        suggestion: 'הוסיפו תיאור קצר של מה שהתרשים מציג.',
      }),
    ];
  }
  return [];
}

// ─────────────────────────────────────────────── fact / interpretation / recommendation

function checkFactSeparation(output: GeneratorOutput, contentKind: string): GateFailure[] {
  if (contentKind !== 'trend') return [];
  const headings = output.body.filter((b) => b.t === 'h2' || b.t === 'h3').map((b) => (b as any).x as string);
  const has = (needle: string) => headings.some((h) => h.includes(needle));
  if (has('עובד') && has('פרשנ') && has('המלצ')) return [];
  return [
    fail(
      'fact-separation',
      'review',
      'חסרה הפרדה ברורה בין עובדה, פרשנות והמלצה',
      'כתבת מגמה חייבת כותרות נפרדות לעובדה המאומתת, לפרשנות, ולהמלצה, כדי שקוראים לא יבלבלו בין השלושה.',
      {
        location: 'מבנה הכתבה',
        suggestion: 'הוסיפו כותרות ## עובדה, ## פרשנות, ## המלצה בגוף הכתבה, ואז הריצו בדיקה מחדש.',
      }
    ),
  ];
}

// ─────────────────────────────────────────────── keyword stuffing

function checkKeywordStuffing(output: GeneratorOutput): GateFailure[] {
  const kw = output.seo.primaryKeyword?.trim().toLowerCase();
  if (!kw) return [];
  const body = textOf(output).toLowerCase();
  const words = body.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const occurrences = body.split(kw).length - 1;
  const density = occurrences / words.length;
  if (density <= 0.06) return [];
  return [
    fail('keyword-stuffing', 'info', 'מילת המפתח חוזרת בתדירות גבוהה', 'זה יכול להיראות לא טבעי לקוראים ולפגוע ב-SEO.', {
      location: 'גוף הכתבה',
      suggestion: 'נסחו חלק מהחזרות מחדש במילים נרדפות.',
    }),
  ];
}

// ─────────────────────────────────────────────── minimum content

function checkMinimumContent(output: GeneratorOutput): GateFailure[] {
  const words = textOf(output).split(/\s+/).filter(Boolean).length;
  if (words >= 30) return [];
  return [
    fail('minimum-content', 'blocking', 'הכתבה קצרה מדי', 'אין מספיק תוכן כדי שהמאמר יהיה שימושי לקוראים.', {
      location: 'גוף הכתבה',
      suggestion: 'הוסיפו תוכן בעריכה, או חזרו לשלב ההדבקה ונסו שוב עם תשובה מלאה יותר.',
    }),
  ];
}

export function runGates(args: {
  output: GeneratorOutput;
  opportunity: Opportunity | null;
  briefNotes: string;
  contentKind: string;
  existingArticles: Article[];
}): GateResult {
  const failures: GateFailure[] = [
    ...checkEmDash(args.output),
    ...checkInventedNumbers(args.output, args.opportunity, args.briefNotes),
    ...checkDuplicateTopic(args.output, args.existingArticles),
    ...checkSeoCompleteness(args.output),
    ...checkImageCompleteness(args.output),
    ...checkFactSeparation(args.output, args.contentKind),
    ...checkKeywordStuffing(args.output),
    ...checkMinimumContent(args.output),
  ];
  return { passed: !failures.some((f) => f.severity === 'blocking'), failures };
}
