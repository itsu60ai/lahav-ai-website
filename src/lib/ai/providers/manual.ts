// Stage B: the manual (paste-back) workflow. Zero cost — the admin pastes
// the finished prompt into a Claude or ChatGPT subscription they already
// pay for, and pastes the reply back here. See docs/AI_ENGINE.md.
//
// Two responsibilities live in this one file deliberately: the format
// instructions appended to the prompt, and the parser that reads that same
// format back. Keeping them together is what keeps them in sync — change
// one, you are looking at the other.
//
// THE PARSER IS DELIBERATELY LENIENT. A non-technical person is
// copy-pasting real chat output, not submitting a form. A markdown
// heading, an extra blank line, or a code fence around the whole reply
// must not blow up the parse — see gates.ts and Stage A's own principle:
// bad content still becomes something you can look at and fix, never
// nothing.
import type { Block } from '../../cms/types.ts';
import { buildCanonicalPath } from '../seo.ts';
import { generateMockVisual } from '../visuals.ts';
import { isSvgSafe } from '../validate.ts';
import type { Brief, GeneratorOutput, Opportunity, VisualAsset } from '../types.ts';

// ─────────────────────────────────────────────── the format the AI is asked for

export function buildOutputFormatInstructions(): string {
  return `
פורמט הפלט הנדרש (חשוב מאוד, יש לעקוב במדויק):

השתמשו בדיוק בתגיות הבאות, כל אחת בשורה נפרדת, בפורמט ===שם_תגית===.
כתבו טקסט רגיל, לא JSON. אין צורך במרכאות מיוחדות.

===TITLE===
כותרת הכתבה

===STANDFIRST===
פתיח קצר, משפט או שניים

===EXCERPT===
תקציר קצר לכרטיס תצוגה (עד שתי שורות)

===READING_TIME===
זמן קריאה משוער, לדוגמה: כ-4 דקות קריאה

===BODY===
גוף הכתבה. אפשר להשתמש בסימונים הבאים:
## כותרת משנה (H2)
### כותרת משנה קטנה יותר (H3)
- פריט ברשימה
> ציטוט
[DIAGRAM] סמנו כאן היכן כדאי שיופיע תרשים

אורך: כתבה מלאה, 700 עד 1100 מילים. לא פסקה או שתיים.

קישורים בתוך הטקסט (חשוב, זה מה שגורם לכתבה להיראות כתובה בידי אדם):
שלבו 2 עד 4 קישורים אמיתיים בתוך המשפטים עצמם, בפורמט [טקסט הקישור](כתובת).
הקישור נכנס בדיוק במקום שבו מזכירים את מה שהוא מוביל אליו, לא ברשימה בסוף.
מותר לקשר רק לכתובות שקיבלתם כאן במקור, או לכתובות רשמיות שאתם בטוחים
לחלוטין שהן נכונות (למשל עמוד מוצר רשמי). אסור להמציא כתובת. אם אין לכם
כתובת אמיתית מעבר למקור, קשרו למקור עצמו ולא לשום דבר אחר.

תרשימים: שלבו 2 עד 3 סימוני [DIAGRAM] בנקודות שבהן תרשים באמת עוזר להבין,
ולכל אחד מהם ספקו SVG בהמשך (IMAGE_SVG, IMAGE_SVG_2, IMAGE_SVG_3 לפי הסדר).

אם מדובר בכתבת מגמה (trend), חובה כותרות נפרדות: ## עובדה, ## פרשנות, ## המלצה.

===SEO===
PRIMARY_KEYWORD: מילת המפתח הראשית
SUPPORTING_KEYWORDS: מילה, מילה, מילה
SEO_TITLE: כותרת ל-SEO
META_TITLE: כותרת מטא
META_DESCRIPTION: תיאור מטא, עד 160 תווים
SLUG: כתובת-url-קצרה-באנגלית
SEARCH_INTENT: מה המבקר מחפש כשהוא מגיע לכתבה הזו

===CITATIONS===
- שם המקור | https://example.com
(שורה אחת לכל מקור בו נעשה שימוש בפועל)

===IMAGE===
ALT: תיאור אמיתי של מה שהתמונה מראה
CAPTION: כיתוב קצר, אופציונלי

===IMAGE_SVG===
קוד SVG מקורי לתרשים הראשי (לא תמונה פוטוגרפית, לא רובוט, לא מוח זוהר).
viewBox בגודל 1200 380, צבעים: רקע #f2f4f7, מסגרת/הדגשה #0b1530 ו-#2997ff.
התרשים צריך להראות משהו אמיתי מהכתבה: שלבים בתהליך, השוואה, לפני ואחרי.
אם אין לכם דרך ליצור SVG, השאירו את המקטע הזה ריק ותמונה זמנית תיווצר במקום.

===IMAGE_SVG_2===
SVG לתרשים השני, באותם כללים. אם יש רק תרשים אחד, השאירו ריק.

===IMAGE_SVG_3===
SVG לתרשים השלישי, באותם כללים. אם אין, השאירו ריק.
`.trim();
}

export function buildManualPrompt(basePrompt: string): string {
  return `${basePrompt}\n\n---\n\n${buildOutputFormatInstructions()}`;
}

// ─────────────────────────────────────────────── parsing the pasted reply

export interface ManualParseResult {
  /** null only when nothing usable was found at all — see ManualParseResult.blocked */
  output: GeneratorOutput | null;
  blocked: boolean;
  /** shown to the admin, never hidden — this is what "explain what's missing" means */
  warnings: string[];
}

function stripFence(s: string): string {
  const trimmed = s.trim();
  const fenceMatch = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function stripMdEmphasis(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').trim();
}

/** splits on ===TAG=== markers, tolerant of spacing and case */
function splitSections(raw: string): Record<string, string> {
  const lines = stripFence(raw).split(/\r?\n/);
  const sections: Record<string, string> = {};
  let current: string | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (current) sections[current] = buf.join('\n').trim();
    buf = [];
  };

  for (const line of lines) {
    // Digits matter: IMAGE_SVG_2 / IMAGE_SVG_3 are real tags. Without
    // them in the class the marker was not recognised as a section at all
    // and the whole block, SVG included, was swallowed into the body as
    // literal text -- visible in the finished article as "===IMAGE_SVG_2===".
    const m = line.match(/^\s*={2,}\s*([A-Za-z0-9_]+)\s*={2,}\s*$/);
    if (m) {
      flush();
      current = m[1].toUpperCase();
    } else if (current) {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

function parseKeyValues(section: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of section.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z _]+?)\s*:\s*(.+)$/);
    if (!m) continue;
    const key = m[1].trim().toUpperCase().replace(/\s+/g, '_');
    out[key] = m[2].trim();
  }
  return out;
}

function parseBody(section: string): { blocks: Block[]; hasVizMarker: boolean } {
  const blocks: Block[] = [];
  let hasVizMarker = false;
  let pBuf: string[] = [];
  let listBuf: string[] = [];

  const flushP = () => {
    if (pBuf.length) {
      const text = stripMdEmphasis(pBuf.join(' ').trim());
      if (text) blocks.push({ t: 'p', x: text });
    }
    pBuf = [];
  };
  const flushList = () => {
    if (listBuf.length) blocks.push({ t: 'ul', items: listBuf.map(stripMdEmphasis) });
    listBuf = [];
  };

  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushP();
      flushList();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^##\s+(.+)/))) {
      flushP();
      flushList();
      blocks.push({ t: 'h2', x: stripMdEmphasis(m[1]) });
    } else if ((m = line.match(/^###\s+(.+)/))) {
      flushP();
      flushList();
      blocks.push({ t: 'h3', x: stripMdEmphasis(m[1]) });
    } else if ((m = line.match(/^>\s?(.+)/))) {
      flushP();
      flushList();
      blocks.push({ t: 'quote', x: stripMdEmphasis(m[1]) });
    } else if ((m = line.match(/^[-*]\s+(.+)/))) {
      flushP();
      listBuf.push(m[1]);
    } else if (/^\[(DIAGRAM|VIZ)\]/i.test(line)) {
      flushP();
      flushList();
      blocks.push({ t: 'viz' });
      hasVizMarker = true;
    } else {
      flushList();
      pBuf.push(line);
    }
  }
  flushP();
  flushList();

  if (!hasVizMarker) blocks.push({ t: 'viz' });
  return { blocks, hasVizMarker };
}

function parseCitations(section: string): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = [];
  for (const line of section.split(/\r?\n/)) {
    const m = line.match(/^\s*[-*]\s*(.+?)\s*\|\s*(https?:\/\/\S+)\s*$/);
    if (m) out.push({ label: m[1].trim(), url: m[2].trim() });
  }
  return out;
}

function slugify(input: string): string {
  const s = (input || '')
    .trim()
    .toLowerCase()
    .replace(/["'׳״]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'article';
}

function buildVisual(
  imageSection: string,
  svgSection: string,
  brief: Brief,
  slug: string,
  warnings: string[]
): Omit<VisualAsset, 'id'> {
  const kv = parseKeyValues(imageSection);
  const svgCandidate = stripFence(svgSection || '');
  const looksLikeSvg = /^<svg[\s>]/i.test(svgCandidate);

  if (looksLikeSvg && isSvgSafe(svgCandidate)) {
    return {
      kind: 'hero',
      format: 'svg',
      filename: `${slug}-hero.svg`,
      altText: kv.ALT || `תרשים לכתבה בנושא ${brief.topic}`,
      caption: kv.CAPTION || '',
      width: 1200,
      height: 380,
      svgMarkup: svgCandidate,
      source: 'generated',
    };
  }

  if (svgCandidate) {
    warnings.push(
      looksLikeSvg
        ? 'התרשים שהודבק נחסם משום שהכיל תוכן לא בטוח, ולכן הוחלף בתמונה זמנית.'
        : 'לא זוהה קוד SVG תקין בתשובה שהודבקה, ולכן נוצרה תמונה זמנית במקום.'
    );
  } else {
    warnings.push('לא סופק תרשים בתשובה שהודבקה, ולכן נוצרה תמונה זמנית במקום. אפשר להחליף אותה מאוחר יותר.');
  }

  const fallback = generateMockVisual({ brief, kindLabel: '', slug });
  return kv.ALT ? { ...fallback, altText: kv.ALT, caption: kv.CAPTION || fallback.caption } : fallback;
}

export function parseManualResult(
  raw: string,
  opportunity: Opportunity | null,
  brief: Brief
): ManualParseResult {
  const warnings: string[] = [];
  const sections = splitSections(raw);

  const title = (sections.TITLE || '').trim();
  const { blocks: body } = sections.BODY ? parseBody(sections.BODY) : { blocks: [] as Block[] };
  const realBodyBlocks = body.filter((b) => b.t !== 'viz');

  if (!title && realBodyBlocks.length === 0) {
    return {
      output: null,
      blocked: true,
      warnings: [
        'לא הצלחנו למצוא כותרת או תוכן בתשובה שהודבקה. ודאו שהודבקה התשובה המלאה מהצ\'אט, כולל התגיות ===TITLE=== ו-===BODY===, ונסו שוב.',
      ],
    };
  }
  if (!title) warnings.push('לא נמצאה כותרת (===TITLE===). הושלמה כותרת זמנית מהנושא המקורי.');
  if (realBodyBlocks.length === 0) warnings.push('לא נמצא תוכן ממשי בגוף הכתבה (===BODY===).');

  const seoKv = sections.SEO ? parseKeyValues(sections.SEO) : {};
  const finalTitle = title || brief.topic;
  const slug = slugify(seoKv.SLUG || finalTitle);

  if (!sections.SEO) warnings.push('לא נמצאה חבילת SEO (===SEO===). הושלמו ערכי ברירת מחדל, כדאי לבדוק ולערוך.');
  if (!seoKv.META_DESCRIPTION) warnings.push('חסר meta description בחבילת ה-SEO.');
  if (!seoKv.PRIMARY_KEYWORD) warnings.push('חסרה מילת מפתח ראשית בחבילת ה-SEO.');

  const parsedCitations = sections.CITATIONS ? parseCitations(sections.CITATIONS) : [];
  const citations = [...parsedCitations];
  if (opportunity && !citations.some((c) => c.url === opportunity.sourceUrl)) {
    citations.unshift({ label: opportunity.sourceName, url: opportunity.sourceUrl });
  }
  if (citations.length === 0) warnings.push('לא נמצא אף מקור מצוטט (===CITATIONS===).');

  const visual = buildVisual(sections.IMAGE || '', sections.IMAGE_SVG || '', brief, slug, warnings);

  // A real, article-specific diagram replaces the generic placeholder
  // marker in the body — the generic site diagram stays as the fallback
  // (visual.source === 'mock') exactly when no valid SVG was supplied.
  //
  // Up to three diagrams are supported (2026-09-03). One bare diagram per
  // article read as machine output; a piece with a diagram at each point
  // where one actually helps reads as something a person built. The Nth
  // [DIAGRAM] marker in the body takes the Nth supplied SVG, and any
  // marker with no SVG behind it stays the site's own generic figure.
  let finalBody = body.length > 0 ? body : [{ t: 'p' as const, x: '(לא נמצא תוכן, יש לערוך את הטיוטה)' }, { t: 'viz' as const }];

  const extraSvgs = [sections.IMAGE_SVG_2 ?? '', sections.IMAGE_SVG_3 ?? '']
    .map((raw) => stripFence(raw || ''))
    .filter((c) => /^<svg[\s>]/i.test(c) && isSvgSafe(c));

  const inlineDiagrams = [
    ...(visual.source === 'generated'
      ? [{ svg: visual.svgMarkup as string, alt: visual.altText, caption: visual.caption }]
      : []),
    ...extraSvgs.map((svg, i) => ({
      svg,
      alt: `תרשים ${i + 2} לכתבה בנושא ${brief.topic}`,
      caption: '',
    })),
  ];

  if (inlineDiagrams.length > 0) {
    finalBody = [...finalBody];
    let used = 0;
    for (let i = 0; i < finalBody.length && used < inlineDiagrams.length; i += 1) {
      if (finalBody[i].t !== 'viz') continue;
      const d = inlineDiagrams[used];
      finalBody[i] = { t: 'aiviz', svg: d.svg, alt: d.alt, caption: d.caption };
      used += 1;
    }
    // More diagrams than markers: append the leftovers rather than drop
    // work the model already did.
    for (; used < inlineDiagrams.length; used += 1) {
      const d = inlineDiagrams[used];
      finalBody.push({ t: 'aiviz', svg: d.svg, alt: d.alt, caption: d.caption });
    }
  }

  const output: GeneratorOutput = {
    title: finalTitle,
    standfirst: sections.STANDFIRST?.trim() || brief.goal || '',
    excerpt: sections.EXCERPT?.trim() || (realBodyBlocks[0] && 'x' in realBodyBlocks[0] ? (realBodyBlocks[0] as any).x.slice(0, 140) : ''),
    readingTime: sections.READING_TIME?.trim() || 'כמה דקות קריאה',
    body: finalBody,
    seo: {
      searchIntent: seoKv.SEARCH_INTENT || '',
      primaryKeyword: seoKv.PRIMARY_KEYWORD || finalTitle,
      supportingKeywords: (seoKv.SUPPORTING_KEYWORDS || '').split(',').map((s) => s.trim()).filter(Boolean),
      seoTitle: seoKv.SEO_TITLE || finalTitle,
      h1: finalTitle,
      metaTitle: seoKv.META_TITLE || `${finalTitle} | LAHAV AI`,
      metaDescription: seoKv.META_DESCRIPTION || sections.EXCERPT?.trim() || '',
      slug,
      h2h3Outline: body.filter((b) => b.t === 'h2' || b.t === 'h3').map((b) => (b as any).x),
      internalLinkSlugs: [],
      serviceSlug: brief.serviceSlug,
      relatedSlugs: [],
      citations,
      canonicalPath: buildCanonicalPath(slug),
      indexable: false,
    },
    visual,
  };

  return { output, blocked: false, warnings };
}
