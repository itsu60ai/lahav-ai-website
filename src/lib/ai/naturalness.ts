// Hebrew naturalness linter. PURE FUNCTIONS ONLY: no I/O, no fetch, no
// Astro import, no Cloudflare binding, no dependency on this repo's other
// modules. That is deliberate — this file is meant to be unit-testable by
// running it under plain node/tsx, and it mirrors the Python linter that
// lives in the COPYWRITER AI project so the two stay comparable.
//
// The rule DATA never lives here. It comes from `voice.generated.ts`,
// which is generated out of COPYWRITER AI/voice_rules.json by
// `npm run build:voice`. This file only knows how to apply rules, never
// which rules exist.
//
// See docs/AI_ENGINE.md section 9 (Quality gates) and docs/COPY_STYLE.md.

// ─────────────────────────────────────────────── the rule-file shape
//
// This mirrors the machine contract of voice_rules.json. Everything except
// `version` is optional on purpose: the rule file is produced by another
// project, it may gain extra fields, and a missing section must degrade to
// "don't run that check" instead of throwing inside a gate.

export type NaturalnessSeverity = 'blocking' | 'review' | 'info';

export interface BannedTerm {
  term: string;
  suggest?: string;
  severity?: NaturalnessSeverity;
  /** only 'substring' is defined by the contract today; unknown values are treated as substring */
  match?: string;
}

export interface BannedChar {
  char: string;
  name?: string;
  suggest?: string;
  severity?: NaturalnessSeverity;
}

export interface VoiceMetrics {
  max_sentence_words?: number;
  max_long_sentence_ratio?: number;
  max_paragraph_sentences?: number;
  avg_sentence_words_range?: [number, number] | number[];
}

export interface HeadingRules {
  forbid_bare_noun_heading?: boolean;
  min_heading_words?: number;
}

export interface ClaimRules {
  absolute_legal_terms?: string[];
  requires_source_marker?: string[];
}

export interface VoiceScoring {
  blocking_zero_tolerance?: boolean;
  pass_threshold?: number;
}

export interface VoiceRules {
  version: string;
  banned_lexicon?: BannedTerm[];
  banned_chars?: BannedChar[];
  metrics?: VoiceMetrics;
  heading_rules?: HeadingRules;
  claim_rules?: ClaimRules;
  scoring?: VoiceScoring;
}

export interface NaturalnessFinding {
  /** stable id for logs and for grouping, e.g. "lexicon:מהווה", "sentence-length" */
  rule: string;
  severity: NaturalnessSeverity;
  /** the exact evidence, quoted verbatim from the text */
  quote: string;
  /** why this was flagged, in Hebrew */
  why: string;
  /** what to do about it, in Hebrew */
  suggest: string;
}

// ─────────────────────────────────────────────── text splitting helpers

const SENTENCE_SPLIT = /(?<=[.!?׃])\s+|\n+/;

/** sentences, in order, with empties dropped */
export function splitSentences(text: string): string[] {
  return text
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** paragraphs = blank-line separated blocks; a single-block text is one paragraph */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function quote(s: string, max = 220): string {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** the full sentence containing a needle, for evidence quoting */
function sentenceContaining(text: string, needle: string): string {
  const hit = splitSentences(text).find((s) => s.includes(needle));
  return quote(hit ?? needle);
}

const TERMINAL_PUNCT = /[.!?׃:]$/;

/**
 * Heading detection from plain text, best effort.
 *
 * A heading is either an explicit markdown heading line, a line that is
 * entirely bold (`**...**`), or a short standalone line with no terminal
 * punctuation. The last case is a heuristic and is deliberately narrow
 * (<= 8 words) so ordinary sentence fragments, which this house style
 * actively encourages, are not mistaken for headings.
 *
 * NOTE for callers: if the text you pass has had its headings flattened
 * into one long line (as gates.ts `textOf()` does), no headings will be
 * detected and the heading checks simply produce nothing. That is a
 * false-negative-by-design, never a false positive.
 */
export function extractHeadings(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const md = /^#{1,6}\s+(.*)$/.exec(line);
    if (md?.[1]) {
      out.push(md[1].trim());
      continue;
    }
    const bold = /^\*\*(.+)\*\*$/.exec(line);
    if (bold?.[1]) {
      out.push(bold[1].trim());
      continue;
    }
    if (!TERMINAL_PUNCT.test(line) && wordCount(line) <= 8 && wordCount(line) >= 1) {
      out.push(line);
    }
  }
  return out;
}

/**
 * Very rough "does this heading contain something that behaves like a verb
 * or an address to the reader" test. Hebrew has no cheap POS tagging here,
 * so this looks for the prefixes that carry inflected verbs (א/ת/י/נ/מ +
 * at least three more letters), the ש/כש/ל subordinators, a question mark,
 * or a direct second-person plural pronoun. A heading with none of those is
 * treated as a bare noun phrase ("יישום מעשי", "יתרונות"), which the style
 * guide bans in favour of spoken headings ("אז מה עושים עם זה").
 */
function headingLooksSpoken(heading: string): boolean {
  if (heading.includes('?')) return true;
  const words = heading.split(/\s+/).filter(Boolean);
  const SPOKEN_WORDS = ['אתם', 'שלכם', 'אנחנו', 'שלנו', 'זה', 'איך', 'מה', 'למה', 'מתי', 'כמה', 'אז', 'לא', 'בלי'];
  if (words.some((w) => SPOKEN_WORDS.includes(w.replace(/[^\p{L}]/gu, '')))) return true;
  return words.some((w) => /^[אתינמש]\p{L}{3,}/u.test(w));
}

// ─────────────────────────────────────────────── individual checks

function checkBannedLexicon(text: string, rules: VoiceRules): NaturalnessFinding[] {
  const out: NaturalnessFinding[] = [];
  for (const entry of rules.banned_lexicon ?? []) {
    const term = entry?.term?.trim();
    if (!term) continue;
    if (!text.includes(term)) continue;
    out.push({
      rule: `lexicon:${term}`,
      severity: entry.severity ?? 'review',
      quote: sentenceContaining(text, term),
      why: `הביטוי "${term}" הוא עברית כתובה/רשמית שאף אחד לא אומר בשיחה, והוא אחד הסימנים הכי מסגירים של טקסט שנכתב במכונה.`,
      suggest: entry.suggest ? `החליפו ב: ${entry.suggest}.` : 'נסחו מחדש בעברית מדוברת.',
    });
  }
  return out;
}

function checkBannedChars(text: string, rules: VoiceRules): NaturalnessFinding[] {
  const out: NaturalnessFinding[] = [];
  for (const entry of rules.banned_chars ?? []) {
    const ch = entry?.char;
    if (!ch) continue;
    if (!text.includes(ch)) continue;
    const label = entry.name ? `${entry.name} (${ch})` : ch;
    out.push({
      rule: `char:${entry.name ?? ch}`,
      severity: entry.severity ?? 'review',
      quote: sentenceContaining(text, ch),
      why: `התו ${label} אסור בקופי של האתר, מטעמי סגנון קבוע.`,
      suggest: entry.suggest ? `החליפו ב: ${entry.suggest}.` : 'הסירו את התו או נסחו מחדש.',
    });
  }
  return out;
}

/** how many long-sentence findings a single run will emit before it stops
 *  listing them individually; the ratio finding covers the rest */
const MAX_LONG_SENTENCE_FINDINGS = 5;

function checkSentenceLength(text: string, rules: VoiceRules): NaturalnessFinding[] {
  const max = rules.metrics?.max_sentence_words;
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];
  const out: NaturalnessFinding[] = [];

  if (typeof max === 'number' && max > 0) {
    const long = sentences.filter((s) => wordCount(s) > max);
    for (const s of long.slice(0, MAX_LONG_SENTENCE_FINDINGS)) {
      out.push({
        rule: 'sentence-length',
        severity: 'review',
        quote: quote(s),
        why: `המשפט הזה באורך ${wordCount(s)} מילים, מעל המקסימום של ${max}. משפט ריצה ארוך הוא בדיוק המקום שבו נדחסים כמה פרטים לתוך נשימה אחת, וזה נשמע כתוב ולא מדובר.`,
        suggest: 'פצלו לשני משפטים או שלושה. אפשר גם להוציא את הרשימה שבתוכו לשורות נפרדות.',
      });
    }
    const ratio = long.length / sentences.length;
    const maxRatio = rules.metrics?.max_long_sentence_ratio;
    if (typeof maxRatio === 'number' && ratio > maxRatio) {
      out.push({
        rule: 'long-sentence-ratio',
        severity: 'review',
        quote: `${long.length} מתוך ${sentences.length} משפטים`,
        why: `${Math.round(ratio * 100)}% מהמשפטים בטקסט ארוכים מ-${max} מילים, מעל התקרה של ${Math.round(maxRatio * 100)}%. הקצב של הטקסט כבד מדי לאורך כל הדרך, לא רק במשפט אחד.`,
        suggest: 'עברו על הפסקאות הארוכות ופצלו. הקצב הרצוי הוא כמה משפטים קצרים ואז אחד ארוך שמסביר.',
      });
    }
  }

  const range = rules.metrics?.avg_sentence_words_range;
  if (Array.isArray(range) && range.length === 2 && typeof range[0] === 'number' && typeof range[1] === 'number') {
    const avg = sentences.reduce((sum, s) => sum + wordCount(s), 0) / sentences.length;
    if (avg < range[0] || avg > range[1]) {
      out.push({
        rule: 'avg-sentence-length',
        severity: 'info',
        quote: `ממוצע ${avg.toFixed(1)} מילים למשפט`,
        why: `אורך המשפט הממוצע מחוץ לטווח ${range[0]} עד ${range[1]} מילים. מתחת לטווח הטקסט נשמע קטוע, מעליו הוא נשמע כמו דוח.`,
        suggest: 'זו הערה כללית על הקצב, לא על משפט מסוים. שווה לקרוא בקול ולראות איפה זה נתקע.',
      });
    }
  }

  return out;
}

function checkParagraphLength(text: string, rules: VoiceRules): NaturalnessFinding[] {
  const max = rules.metrics?.max_paragraph_sentences;
  if (typeof max !== 'number' || max <= 0) return [];
  const out: NaturalnessFinding[] = [];
  for (const p of splitParagraphs(text)) {
    const count = splitSentences(p).length;
    if (count <= max) continue;
    out.push({
      rule: 'paragraph-length',
      severity: 'review',
      quote: quote(p),
      why: `בפסקה הזו ${count} משפטים, מעל המקסימום של ${max}. פסקה ארוכה מדי קשה לסריקה במסך, ובדרך כלל מסתירה בתוכה שתי נקודות שונות.`,
      suggest: 'פצלו לשתי פסקאות, או הוציאו את הפרטים לרשימה.',
    });
  }
  return out;
}

function checkHeadings(text: string, rules: VoiceRules): NaturalnessFinding[] {
  const hr = rules.heading_rules;
  if (!hr) return [];
  const minWords = hr.min_heading_words;
  const out: NaturalnessFinding[] = [];
  for (const h of extractHeadings(text)) {
    const words = wordCount(h);
    if (typeof minWords === 'number' && words < minWords) {
      out.push({
        rule: 'heading-too-short',
        severity: 'review',
        quote: quote(h),
        why: `הכותרת הזו באורך ${words} מילים, מתחת למינימום של ${minWords}. כותרת של מילה אחת היא כותרת של דוח, לא של כתבה.`,
        suggest: 'כתבו כותרת בשפה מדוברת שמתארת מה באמת כתוב בפסקה שאחריה.',
      });
      continue;
    }
    if (hr.forbid_bare_noun_heading && words <= 3 && !headingLooksSpoken(h)) {
      out.push({
        rule: 'bare-noun-heading',
        severity: 'review',
        quote: quote(h),
        why: 'הכותרת הזו היא צירוף שמות עצם בלי פועל ובלי פנייה לקורא, וזה נשמע כמו סעיף במסמך ולא כמו כותרת משנה בכתבה.',
        suggest: 'נסחו אותה כמו שהייתם אומרים בקול: "אז מה עושים עם זה" במקום "יישום מעשי".',
      });
    }
  }
  return out;
}

/**
 * An absolute legal claim ("לא חוקי", "אסור בחוק") is the exact place where
 * a draft has historically been more categorical than its source actually
 * was. The rule is not "never say it" but "say who says it": the term is
 * accepted when a source marker appears in the same sentence or in the one
 * immediately before it, and flagged otherwise.
 */
function checkAbsoluteClaims(text: string, rules: VoiceRules): NaturalnessFinding[] {
  const terms = rules.claim_rules?.absolute_legal_terms ?? [];
  const markers = rules.claim_rules?.requires_source_marker ?? [];
  if (terms.length === 0) return [];
  const sentences = splitSentences(text);
  const out: NaturalnessFinding[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i] ?? '';
    for (const term of terms) {
      if (!term || !s.includes(term)) continue;
      const key = `${i}:${term}`;
      if (seen.has(key)) continue;
      const prev = i > 0 ? (sentences[i - 1] ?? '') : '';
      const attributed = markers.some((m) => !!m && (s.includes(m) || prev.includes(m)));
      if (attributed) continue;
      seen.add(key);
      out.push({
        rule: 'absolute-claim-without-source',
        severity: 'blocking',
        quote: quote(s),
        why: `הטענה "${term}" מנוסחת כעובדה מוחלטת בלי לומר מי קובע את זה. זו בדיוק הצורה שבה טיוטה יוצאת נחרצת יותר מהמקור שעליו היא מבוססת.`,
        suggest: markers.length
          ? `הוסיפו ייחוס מפורש באותו משפט או במשפט שלפניו (למשל: ${markers.slice(0, 3).join(', ')}), או רככו את הניסוח.`
          : 'הוסיפו ייחוס מפורש למקור, או רככו את הניסוח.',
      });
    }
  }
  return out;
}

// ─────────────────────────────────────────────── public API

/**
 * Runs every check the rule file enables, in a stable order, and returns
 * the findings. Never throws on a partial or unexpected rule file: a
 * missing section simply skips its check.
 */
export function checkNaturalness(text: string, rules: VoiceRules): NaturalnessFinding[] {
  const t = (text ?? '').toString();
  if (!t.trim()) return [];
  if (!rules) return [];
  return [
    ...checkBannedLexicon(t, rules),
    ...checkBannedChars(t, rules),
    ...checkSentenceLength(t, rules),
    ...checkParagraphLength(t, rules),
    ...checkHeadings(t, rules),
    ...checkAbsoluteClaims(t, rules),
  ];
}

/** how much each finding costs, out of a starting 10 */
export const NATURALNESS_WEIGHTS: Record<NaturalnessSeverity, number> = {
  blocking: 2,
  review: 0.5,
  info: 0.15,
};

/** 10 = clean. Starts at 10, subtracts per finding by severity, floors at 0. */
export function scoreNaturalness(findings: NaturalnessFinding[]): number {
  const penalty = (findings ?? []).reduce((sum, f) => sum + (NATURALNESS_WEIGHTS[f.severity] ?? 0.5), 0);
  const score = Math.max(0, 10 - penalty);
  return Math.round(score * 10) / 10;
}

/**
 * Convenience wrapper around the rule file's own `scoring` section, for
 * callers that want a single yes/no. gates.ts deliberately does NOT use
 * this today: it reports findings and lets a human decide.
 */
export function passesNaturalness(findings: NaturalnessFinding[], rules: VoiceRules): boolean {
  const scoring = rules?.scoring ?? {};
  if (scoring.blocking_zero_tolerance && findings.some((f) => f.severity === 'blocking')) return false;
  const threshold = typeof scoring.pass_threshold === 'number' ? scoring.pass_threshold : 8;
  return scoreNaturalness(findings) >= threshold;
}
