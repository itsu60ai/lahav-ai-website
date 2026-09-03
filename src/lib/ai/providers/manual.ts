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
import { youtubeIdFrom } from '../../cms/types.ts';
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

סרטון YouTube: אם יש סרטון אמיתי שבאמת מוסיף לקורא, שימו את הכתובת שלו
לבדה בשורה נפרדת (רק הכתובת, בלי טקסט לפניה או אחריה), ומיד בשורה שאחריה
כתבו כיתוב קצר בעברית שמתאר מה רואים או שומעים בסרטון, בפורמט:
כיתוב: תיאור קצר של הסרטון
זה מוצג מתחת לנגן ומשמש גם למי שלא יכול לראות אותו — אל תדלגו על זה.
הוא יוטמע כנגן בתוך העמוד. אסור להמציא כתובת של סרטון — רק סרטון שקיבלתם
כאן במקור או שמצאתם בחיפוש ברשת ואתם בטוחים שהוא קיים. סרטון שמוזכר
באמצע משפט נשאר קישור רגיל.

קוד: אם הכתבה כוללת דוגמת קוד, פקודה, או פרומפט שהקורא אמור להעתיק,
עטפו אותו בשלושה גרשים אחוריים עם שם השפה, למשל:
\`\`\`python
print("hello")
\`\`\`
זה יוצג בתיבה עם כפתור העתקה. אל תשתמשו בזה לטקסט רגיל.

צילום מסך אמיתי (רק כשבאמת אין ברירה): לפעמים הכתבה חייבת להראות ממשק
אמיתי של כלי ספציפי — למשל "לוחצים על הכפתור הזה בהגדרות של X" — ותמונה
מצולמת-AI תהיה שקרית, כי היא לא הממשק האמיתי. במקרה כזה בלבד, סמנו את
המקום המדויק בגוף הכתבה כך:
[SCREENSHOT]
מה לצלם: תיאור מדויק של המסך או החלון הספציפי
הוראות: שלבים ברורים בעברית - איפה להיכנס, על מה ללחוץ, מה בדיוק צריך
להיראות בתמונה. כאילו מסבירים למישהו שלא מכיר את הכלי בכלל.
[/SCREENSHOT]
זה יופיע למי שעורך את הכתבה כתיבה ברורה עם כפתור העלאה במקום הזה בדיוק
- לא צריך לדאוג לאן זה ילך. אל תשתמשו בזה בתור ברירת מחדל: זה לבקשות
אמיתיות של ממשק אמיתי בלבד. אם תמונה רגילה (===PHOTO_PROMPT=== למטה)
מספיקה, השתמשו בה במקום - היא לא דורשת עבודה מאף אחד.

אורך: כתבה מלאה, 700 עד 1100 מילים. לא פסקה או שתיים.

קישורים בתוך הטקסט (חשוב, זה מה שגורם לכתבה להיראות כתובה בידי אדם):
שלבו 2 עד 4 קישורים אמיתיים בתוך המשפטים עצמם, בפורמט [טקסט הקישור](כתובת).
הקישור נכנס בדיוק במקום שבו מזכירים את מה שהוא מוביל אליו, לא ברשימה בסוף.
מותר לקשר רק לכתובות שקיבלתם כאן במקור, לכתובות רשמיות שאתם בטוחים לחלוטין
שהן נכונות (למשל עמוד מוצר רשמי), או לכתובות אמיתיות שמצאתם עכשיו בעצמכם
באמצעות חיפוש ברשת, אם יש לכם גישה לכלי כזה. אם כן, השתמשו בו בלי היסוס
כדי למצוא עוד עמוד או שניים שרלוונטיים ממש לנושא הספציפי של הכתבה הזו,
לא כתבה כללית על AI. אסור להמציא כתובת. אם אין לכם כתובת אמיתית מעבר למקור,
או שאין לכם גישה לחיפוש, קשרו למקור עצמו
ולא לשום דבר אחר.

אם מדובר בכתבת מגמה: חובה שיהיה ברור לקורא מה עובדה מהמקור ומה הפרשנות
שלכם. עושים את זה בתוך המשפטים ("המקור מדווח ש...", "מה שאנחנו מבינים מזה
הוא..."), ולא בכותרות. אסור לכתוב כותרת בשם "עובדה", "פרשנות" או "המלצה",
זה נראה כמו טופס ולא כמו כתבה.

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

===PHOTO_PROMPT===
שורה ראשונה: תיאור באנגלית של תמונה אמיתית לראש הכתבה. זו לא תמונה מופשטת
של טכנולוגיה, אלא סצנה אנושית שממחישה את הבעיה או הרגע הספציפי שהכתבה הזו
מדברת עליו, לא כל כתבה על AI, אלא הכתבה הזאת דווקא. תשאלו את עצמכם: איזה
רגע ממשי בעסק קטן קורה כשקורה מה שתיארתי בפסקה הראשונה? זה מה שמצלמים.
כתבו משפט אחד או שניים באנגלית בלבד, ותארו מה רואים בפריים.
דוגמה גרועה, כי היא כללית מדי ומתאימה לכל כתבה: "A small shop owner at a
laptop, morning light." זה לא קשור לשום דבר ספציפי.
דוגמה טובה, כי היא הרגע הספציפי מהכתבה: אם הכתבה על תשובות איטיות
לוואטסאפ, "A phone screen with several unanswered WhatsApp messages
piling up, seen over a busy shop owner's shoulder." אם הכתבה על סוכן קוד
שטעה, "A frustrated small business owner looking at a laptop screen
showing an error, sticky notes with to-do lists around the desk."
דוגמה רעה נוספת: "Artificial intelligence concept, digital brain,
futuristic."
אל תבקשו טקסט, מספרים, לוגו או ממשק בתוך התמונה, זה תמיד יוצא מעוות.

שורה שנייה, חובה: ALT_HE: ואז תיאור קצר בעברית של מה בדיוק רואים בתמונה
הזו (לא כותרת הכתבה, ולא סתם "תמונה של עסק" — מה שממש רואים בפריים).
זה מה שמוצג לכל מי שלא רואה את התמונה בעצמו (טכנולוגיה מסייעת, גוגל).
לדוגמה: ALT_HE: בעל חנות בודק בטלפון הודעות וואטסאפ שהצטברו בלי מענה.

===PHOTO_PROMPT_2===
תמונה שנייה, לאמצע הכתבה, באותם כללים: ספציפית לרגע אחר מהכתבה הזו, לא
סצנה כללית. אופציונלי, אפשר להשאיר ריק כולל את ALT_HE.

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
  /**
   * Photographs to generate, in order. Parsing only reads them; the actual
   * image call lives in src/lib/ai/images.ts and runs from generate.ts, so
   * this file stays free of network access.
   */
  photoPrompts: { description: string; alt: string }[];
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

  // Fenced-code state. Lines inside a fence are taken verbatim — no
  // trimming, no markdown handling — because indentation is meaning in code.
  let inFence = false;
  let fenceLang = '';
  let fenceBuf: string[] = [];

  // [SCREENSHOT]...[/SCREENSHOT] state, same shape as the code fence —
  // everything between the markers is the instructions text verbatim, so
  // a numbered "1. ... 2. ..." step list keeps its own line breaks.
  let inShot = false;
  let shotBuf: string[] = [];

  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (/^\[SCREENSHOT\]\s*$/i.test(line)) {
      flushP();
      flushList();
      inShot = true;
      shotBuf = [];
      continue;
    }
    if (inShot) {
      if (/^\[\/SCREENSHOT\]\s*$/i.test(line)) {
        const instructions = shotBuf.join('\n').trim();
        if (instructions) blocks.push({ t: 'shot', instructions, alt: '', caption: '' });
        inShot = false;
        shotBuf = [];
      } else {
        shotBuf.push(rawLine);
      }
      continue;
    }

    const fence = line.match(/^```+\s*([A-Za-z0-9+#._-]*)\s*$/);
    if (fence) {
      if (inFence) {
        const code = fenceBuf.join('\n').replace(/\s+$/, '');
        if (code.trim()) blocks.push({ t: 'code', code, lang: fenceLang, caption: '' });
        inFence = false;
        fenceLang = '';
        fenceBuf = [];
      } else {
        flushP();
        flushList();
        inFence = true;
        fenceLang = (fence[1] || '').toLowerCase();
      }
      continue;
    }
    if (inFence) {
      fenceBuf.push(rawLine);
      continue;
    }

    if (!line) {
      flushP();
      flushList();
      continue;
    }

    // A line that is nothing but a YouTube link becomes a player. A link to
    // a video is a dead end on the page; the reader has to leave to watch
    // it. Only a whole-line link is converted — a video mentioned mid-
    // sentence stays an inline link, where it belongs.
    const bareYt = line.match(/^(?:\[[^\]]*\]\()?(\S+?)\)?$/);
    if (bareYt) {
      const ytId = youtubeIdFrom(bareYt[1]);
      if (ytId) {
        flushP();
        flushList();
        blocks.push({ t: 'yt', id: ytId, title: '', caption: '' });
        continue;
      }
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
  // An unterminated fence would otherwise swallow the rest of the article.
  if (inFence) {
    const code = fenceBuf.join('\n').replace(/\s+$/, '');
    if (code.trim()) blocks.push({ t: 'code', code, lang: fenceLang, caption: '' });
  }
  if (inShot) {
    const instructions = shotBuf.join('\n').trim();
    if (instructions) blocks.push({ t: 'shot', instructions, alt: '', caption: '' });
  }
  flushP();
  flushList();

  // No forced diagram. Every article used to get one appended whether it
  // needed it or not, which is exactly the "why is there a diagram on top
  // of every post" problem. A diagram now appears only where the writer
  // actually asked for one with [DIAGRAM].
  return { blocks: attachYoutubeCaptions(blocks), hasVizMarker };
}

/**
 * A "כיתוב: ..." line right after a bare YouTube URL is exactly what the
 * prompt asks the writer for, but parseBody's own line loop has already
 * turned it into an ordinary paragraph by the time it is seen -- there was
 * no clean way to look ahead one line inside that loop. Fixing it up here,
 * as one pass over the finished block list, is simpler than restructuring
 * the loop: find every `yt` block immediately followed by a paragraph that
 * starts with "כיתוב:", move that text onto the video (both as its
 * caption and its accessible title), and drop the now-redundant paragraph.
 *
 * Every video otherwise ends up with an empty title/caption -- no visible
 * description under the player and a generic "סרטון" for anyone using a
 * screen reader, exactly the gap flagged by the client.
 */
function attachYoutubeCaptions(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const next = blocks[i + 1];
    if (b.t === 'yt' && next?.t === 'p' && /^כיתוב\s*:/.test(next.x)) {
      const caption = next.x.replace(/^כיתוב\s*:\s*/, '').trim();
      out.push({ ...b, title: caption, caption });
      i++; // the caption paragraph is consumed, not emitted on its own
      continue;
    }
    out.push(b);
  }
  return out;
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

  // A missing diagram is the NORMAL, correct outcome now that diagrams are
  // opt-in, so it is not reported as a problem. Only a diagram that was
  // supplied and then rejected is worth telling the admin about.
  if (svgCandidate) {
    warnings.push(
      looksLikeSvg
        ? 'התרשים שהתקבל נחסם משום שהכיל תוכן לא בטוח, ולכן לא נוסף לכתבה.'
        : 'המקטע של התרשים לא הכיל SVG תקין, ולכן לא נוסף תרשים.'
    );
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
      photoPrompts: [],
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

  // A [DIAGRAM] marker with no drawing behind it would otherwise fall back
  // to the site's generic figure, which is decoration standing in for
  // content. Drop those: no diagram is better than a diagram that says
  // nothing.
  finalBody = finalBody.filter((b) => b.t !== 'viz');
  if (finalBody.length === 0) finalBody = [{ t: 'p' as const, x: '(לא נמצא תוכן, יש לערוך את הטיוטה)' }];

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

  const photoPrompts = [sections.PHOTO_PROMPT ?? '', sections.PHOTO_PROMPT_2 ?? '']
    .map(splitPhotoSection)
    .filter((p): p is { description: string; alt: string } => p.description.length > 0);

  return { output, blocked: false, warnings, photoPrompts };
}

/**
 * Splits a PHOTO_PROMPT section into the English scene sent to the image
 * model and the writer's own "ALT_HE: ..." line describing what is
 * actually in that photo. Missing ALT_HE is not an error -- the prompt
 * marks it required, but a real reply can still omit it, and a photo with
 * no accessible description is better than no photo at all.
 */
function splitPhotoSection(raw: string): { description: string; alt: string } {
  const lines = raw.split(/\r?\n/);
  const altLine = lines.find((l) => /^ALT_HE\s*:/i.test(l.trim()));
  const alt = altLine ? altLine.trim().replace(/^ALT_HE\s*:\s*/i, '').trim() : '';
  const description = lines
    .filter((l) => !/^ALT_HE\s*:/i.test(l.trim()))
    .join(' ')
    .trim();
  return { description, alt };
}
