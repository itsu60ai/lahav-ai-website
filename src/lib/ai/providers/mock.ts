// The MOCK text provider. Zero cost, no network, fully deterministic.
// Exists so the whole workflow (draft, edit, preview, gates, SEO, visuals,
// learning, publish) can be built and tested without an API key — see
// docs/AI_ENGINE.md section 3. Its output is templated, not written, and
// the article it produces is always marked isPlaceholder so nobody
// mistakes mock text for a real article (the CMS already refuses to index
// or feature a placeholder — see src/pages/articles/[slug].astro).
import { slugify } from '../../cms/context.ts';
import type { Block } from '../../cms/types.ts';
import { buildCanonicalPath } from '../seo.ts';
import { CONTENT_KIND_LABELS } from '../types.ts';
import type { GeneratorInput, GeneratorMeta, GeneratorOutput, TextGenerator } from '../types.ts';
import { generateMockVisual } from '../visuals.ts';

/**
 * Wraps possibly-English text in Unicode bidi isolate marks (U+2066 / U+2069)
 * before it is concatenated into a Hebrew sentence.
 *
 * WITHOUT THIS, an English opportunity headline glued onto Hebrew wrapper
 * text renders VISUALLY SCRAMBLED, not just oddly spaced: "OpenAI's new
 * reasoning technique alarms AI safety experts (טיוטת דוגמה)" came out on
 * screen as "...alarms AI safety (טיוטת דוגמה) experts" -- the last English
 * word jumped past the Hebrew parenthetical, because the page's base
 * direction is RTL and the browser's bidi algorithm reorders alternating
 * LTR/RTL runs as blocks. The isolate marks tell it "this run is a sealed
 * unit, don't let its direction bleed into what is next to it" -- the
 * standard fix, and one that works everywhere the string travels (page
 * title, meta tags, the database), not only inside HTML markup like a
 * <bdi> tag would.
 */
function isolate(s: string): string {
  return `⁦${s}⁩`;
}

function bodyFor(kindLabel: string, brief: GeneratorInput['brief'], opp: GeneratorInput['opportunity']): Block[] {
  const body: Block[] = [
    { t: 'p', x: `זהו טיוטת דוגמה שנוצרה במצב בדיקה (MOCK), ללא שימוש בבינה מלאכותית בתשלום. הטקסט נועד לבדוק את התהליך המלא, לא לפרסום.` },
  ];

  if (brief.contentKind === 'trend' && opp) {
    // NOT "## עובדה / ## פרשנות / ## המלצה". Those headings were the exact
    // thing removed everywhere else this engine writes trend content (the
    // prompt now bans them, and so does the gate that checks for this) --
    // this template was the one place still building them, so a mock
    // "טיוטת דוגמה" was quietly showing the client the old, rejected shape.
    // isolate() keeps a raw English headline from visually reordering when
    // it sits inside this Hebrew sentence (see isolate()'s own comment).
    body.push(
      { t: 'p', x: `לפי ${opp.sourceName}: ${isolate(opp.headline)}` },
      {
        t: 'p',
        x: opp.whyItMatters
          ? `מה שזה אומר: ${opp.whyItMatters}`
          : 'מה שזה אומר לדוגמה: יש לבחון את המשמעות העסקית בפועל לפני פרסום.',
      },
      {
        t: 'p',
        x: opp.suggestedAngle
          ? `מה שכדאי לבדוק: ${opp.suggestedAngle}`
          : 'מה שכדאי לבדוק לדוגמה: התאמה לצרכי הלקוחות לפני שינוי תהליך עבודה.',
      }
    );
  } else {
    body.push(
      { t: 'h2', x: `למה זה רלוונטי (${kindLabel})` },
      { t: 'p', x: brief.goal || 'תיאור לדוגמה של מטרת הכתבה.' },
      { t: 'h2', x: 'מה בעל עסק יכול לעשות עם זה' },
      { t: 'ul', items: ['שלב לדוגמה ראשון', 'שלב לדוגמה שני', 'שלב לדוגמה שלישי'] },
    );
  }

  // No forced diagram. This used to push {t:'viz'} onto every mock
  // article unconditionally -- the exact "diagram on top of every post
  // whether it needed one or not" behaviour that was deliberately removed
  // from the real providers. Left here, it meant the FREE test button kept
  // showing a leftover "[[תרשים 1]]" marker nobody asked for.
  return body;
}

export const mockGenerator: TextGenerator = {
  mode: 'mock',

  async generate(input: GeneratorInput): Promise<{ output: GeneratorOutput; meta: GeneratorMeta }> {
    const { brief, opportunity } = input;
    const kindLabel = CONTENT_KIND_LABELS[brief.contentKind];
    // brief.topic is frequently a real headline harvested from an English
    // source (mock mode echoes it as-is; it does not rewrite anything) --
    // isolate() keeps it from visually scrambling against the Hebrew
    // suffix. See isolate()'s own comment for what that looked like.
    const topicForDisplay = brief.topic || 'נושא לא צוין';
    const title = `${isolate(topicForDisplay)} (טיוטת דוגמה)`;
    // Slugify the topic alone, not the display title — otherwise the
    // "(טיוטת דוגמה)" suffix ends up baked into every generated URL.
    const slug = slugify(topicForDisplay);

    const output: GeneratorOutput = {
      title,
      standfirst: brief.goal || `מה שבעלי עסקים צריכים לדעת על ${isolate(topicForDisplay)}.`,
      excerpt: `כתבת דוגמה בנושא ${isolate(topicForDisplay)}, שנוצרה במצב בדיקה ללא עלות.`,
      readingTime: 'כ-3 דקות קריאה',
      body: bodyFor(kindLabel, brief, opportunity),
      seo: {
        searchIntent: 'מידע',
        primaryKeyword: topicForDisplay,
        supportingKeywords: [kindLabel, brief.serviceSlug].filter(Boolean),
        seoTitle: title,
        h1: title,
        metaTitle: `${title} | LAHAV AI`,
        metaDescription: `כתבת דוגמה בנושא ${isolate(topicForDisplay)}. נוצרה במצב בדיקה ללא עלות, לצורכי בדיקת התהליך בלבד.`,
        slug,
        h2h3Outline: ['למה זה רלוונטי', 'מה בעל עסק יכול לעשות עם זה'],
        internalLinkSlugs: [],
        serviceSlug: brief.serviceSlug,
        relatedSlugs: [],
        citations: opportunity ? [{ label: opportunity.sourceName, url: opportunity.sourceUrl }] : [],
        canonicalPath: buildCanonicalPath(slug),
        indexable: false,
      },
      visual: generateMockVisual({ brief, kindLabel, slug }),
    };

    return {
      output,
      meta: { model: 'mock-template-v1', mode: 'mock', inputTokens: 0, outputTokens: 0, costUsd: 0 },
    };
  },
};
