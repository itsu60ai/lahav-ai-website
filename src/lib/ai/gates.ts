// Quality gates. See docs/AI_ENGINE.md section 9.
//
// STAGE A SCOPE, STATED HONESTLY: these gates run on every generation and
// their results are always shown to the admin. They are ADVISORY today —
// they do not block the existing, already-tested manual publish flow
// (src/pages/api/admin/status.ts is unchanged). They become a HARD block
// only for Auto Publish, which does not exist yet (Stage D). This is a
// deliberate choice: a heuristic gate can have false positives, and
// blocking the human review path on one would fight the "human review is
// the default workflow" principle rather than serve it.
//
// The invented-numbers and duplicate-topic checks are heuristics, not
// certainty — they flag for human attention rather than silently deciding.
import type { Article } from '../cms/types.ts';
import type { GateFailure, GateResult, GeneratorOutput, Opportunity } from './types.ts';

const EM_DASH = '—';

function textOf(output: GeneratorOutput): string {
  const bodyText = output.body
    .map((b) => ('x' in b ? b.x : 'items' in b ? b.items.join(' ') : ''))
    .join(' ');
  return [output.title, output.standfirst, output.excerpt, bodyText].join(' ');
}

function checkEmDash(output: GeneratorOutput): GateFailure[] {
  const all = [textOf(output), output.seo.seoTitle, output.seo.metaDescription].join(' ');
  return all.includes(EM_DASH)
    ? [{ gate: 'em-dash', message: 'הטקסט מכיל מקף ארוך (—), שאסור בכלל בקופי של האתר' }]
    : [];
}

/** A number/percentage in the body that does not also appear in the
 *  opportunity's own source text or the admin's brief notes is flagged as
 *  possibly invented, per the project's standing truth rule. */
function checkInventedNumbers(output: GeneratorOutput, opportunity: Opportunity | null, notes: string): GateFailure[] {
  const body = textOf(output);
  const numberPattern = /\d+(\.\d+)?%?/g;
  const found = body.match(numberPattern) ?? [];
  if (found.length === 0) return [];

  const sourceText = [opportunity?.headline, opportunity?.summary, opportunity?.whyItMatters, notes]
    .filter(Boolean)
    .join(' ');

  const unsupported = found.filter((n) => !sourceText.includes(n));
  if (unsupported.length === 0) return [];
  return [
    {
      gate: 'invented-numbers',
      message: `נמצאו מספרים בטקסט שלא הופיעו במקור או בהערות (${unsupported.join(', ')}), יש לאשר ידנית שאינם מומצאים`,
    },
  ];
}

function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/["'׳״]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function checkDuplicateTopic(output: GeneratorOutput, existing: Article[]): GateFailure[] {
  const newTokens = new Set(normalizeForCompare(output.title).split(/\s+/).filter((w) => w.length > 2));
  if (newTokens.size === 0) return [];

  for (const a of existing) {
    const existingTokens = new Set(normalizeForCompare(a.title).split(/\s+/).filter((w) => w.length > 2));
    if (existingTokens.size === 0) continue;
    const overlap = [...newTokens].filter((t) => existingTokens.has(t)).length;
    const ratio = overlap / Math.min(newTokens.size, existingTokens.size);
    if (ratio >= 0.7) {
      return [
        {
          gate: 'duplicate-topic',
          message: `הכותרת קרובה מאוד למאמר קיים: "${a.title}"`,
        },
      ];
    }
  }
  return [];
}

function checkSeoCompleteness(output: GeneratorOutput): GateFailure[] {
  const failures: GateFailure[] = [];
  const seo = output.seo;
  if (!seo.metaTitle) failures.push({ gate: 'seo-completeness', message: 'meta title חסר' });
  if (!seo.metaDescription) failures.push({ gate: 'seo-completeness', message: 'meta description חסר' });
  if (!seo.slug) failures.push({ gate: 'seo-completeness', message: 'slug חסר' });
  if (!seo.primaryKeyword) failures.push({ gate: 'seo-completeness', message: 'מילת מפתח ראשית חסרה' });
  return failures;
}

function checkImageCompleteness(output: GeneratorOutput): GateFailure[] {
  if (!output.visual) return [{ gate: 'image-completeness', message: 'אין תמונה מצורפת' }];
  if (!output.visual.altText?.trim()) {
    return [{ gate: 'image-completeness', message: 'טקסט חלופי (alt) חסר לתמונה' }];
  }
  return [];
}

function checkFactSeparation(output: GeneratorOutput, contentKind: string): GateFailure[] {
  if (contentKind !== 'trend') return [];
  const headings = output.body.filter((b) => b.t === 'h2' || b.t === 'h3').map((b) => (b as any).x as string);
  const has = (needle: string) => headings.some((h) => h.includes(needle));
  if (!(has('עובד') && has('פרשנ') && has('המלצ'))) {
    return [
      {
        gate: 'fact-separation',
        message: 'כתבת מגמה חייבת להפריד בבירור בין עובדה, פרשנות והמלצה בכותרות נפרדות',
      },
    ];
  }
  return [];
}

function checkKeywordStuffing(output: GeneratorOutput): GateFailure[] {
  const kw = output.seo.primaryKeyword?.trim().toLowerCase();
  if (!kw) return [];
  const body = textOf(output).toLowerCase();
  const words = body.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const occurrences = body.split(kw).length - 1;
  const density = occurrences / words.length;
  if (density > 0.06) {
    return [{ gate: 'keyword-stuffing', message: 'מילת המפתח הראשית חוזרת בתדירות גבוהה מדי בטקסט' }];
  }
  return [];
}

function checkMinimumContent(output: GeneratorOutput): GateFailure[] {
  const words = textOf(output).split(/\s+/).filter(Boolean).length;
  return words < 30 ? [{ gate: 'minimum-content', message: 'הכתבה קצרה מדי כדי להוות תוכן שימושי' }] : [];
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
  return { passed: failures.length === 0, failures };
}
