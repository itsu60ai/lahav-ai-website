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

function bodyFor(kindLabel: string, brief: GeneratorInput['brief'], opp: GeneratorInput['opportunity']): Block[] {
  const body: Block[] = [
    { t: 'p', x: `זהו טיוטת דוגמה שנוצרה במצב בדיקה (MOCK), ללא שימוש בבינה מלאכותית בתשלום. הטקסט נועד לבדוק את התהליך המלא, לא לפרסום.` },
  ];

  if (brief.contentKind === 'trend' && opp) {
    body.push(
      { t: 'h2', x: 'עובדה' },
      { t: 'p', x: `לפי ${opp.sourceName}: ${opp.headline}` },
      { t: 'h2', x: 'פרשנות' },
      { t: 'p', x: `${opp.whyItMatters || 'פרשנות לדוגמה: יש לבחון את המשמעות העסקית בפועל לפני פרסום.'}` },
      { t: 'h2', x: 'המלצה' },
      { t: 'p', x: `${opp.suggestedAngle || 'המלצה לדוגמה: לבדוק התאמה לצרכי הלקוחות לפני שינוי תהליך עבודה.'}` },
    );
  } else {
    body.push(
      { t: 'h2', x: `למה זה רלוונטי (${kindLabel})` },
      { t: 'p', x: brief.goal || 'תיאור לדוגמה של מטרת הכתבה.' },
      { t: 'h2', x: 'מה בעל עסק יכול לעשות עם זה' },
      { t: 'ul', items: ['שלב לדוגמה ראשון', 'שלב לדוגמה שני', 'שלב לדוגמה שלישי'] },
    );
  }

  body.push({ t: 'viz' });
  return body;
}

export const mockGenerator: TextGenerator = {
  mode: 'mock',

  async generate(input: GeneratorInput): Promise<{ output: GeneratorOutput; meta: GeneratorMeta }> {
    const { brief, opportunity } = input;
    const kindLabel = CONTENT_KIND_LABELS[brief.contentKind];
    const title = `${brief.topic} (טיוטת דוגמה)`;
    // Slugify the topic alone, not the display title — otherwise the
    // "(טיוטת דוגמה)" suffix ends up baked into every generated URL.
    const slug = slugify(brief.topic);

    const output: GeneratorOutput = {
      title,
      standfirst: brief.goal || `מה שבעלי עסקים צריכים לדעת על ${brief.topic}.`,
      excerpt: `כתבת דוגמה בנושא ${brief.topic}, שנוצרה במצב בדיקה ללא עלות.`,
      readingTime: 'כ-3 דקות קריאה',
      body: bodyFor(kindLabel, brief, opportunity),
      seo: {
        searchIntent: 'מידע',
        primaryKeyword: brief.topic,
        supportingKeywords: [kindLabel, brief.serviceSlug].filter(Boolean),
        seoTitle: title,
        h1: title,
        metaTitle: `${title} | LAHAV AI`,
        metaDescription: `כתבת דוגמה בנושא ${brief.topic}. נוצרה במצב בדיקה ללא עלות, לצורכי בדיקת התהליך בלבד.`,
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
