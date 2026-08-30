// The mechanical half of the SEO package: everything that is deterministic
// and therefore belongs in code, not in a prompt (docs/AI_ENGINE.md,
// section 6). A model can forget a canonical tag. A template cannot.
//
// No domain is deployed yet (see docs/SOURCE_OF_TRUTH.md, F-5), so
// canonicalPath is a site-relative path; the moment a real domain exists,
// one base URL constant is prefixed here and nothing else changes.
import { slugify } from '../cms/context.ts';
import type { Article } from '../cms/types.ts';

export function buildCanonicalPath(slug: string): string {
  return `/articles/${slug}/`;
}

export function pickSlug(title: string, existingSlugs: Set<string>): string {
  let base = slugify(title);
  let slug = base;
  let n = 2;
  while (existingSlugs.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

/** Article/BlogPosting JSON-LD. Built once the article exists (needs its id/dates). */
export function buildArticleJsonLd(a: Article): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description: a.excerpt,
    author: { '@type': 'Person', name: 'Ethan Lahav' },
    datePublished: a.publishedAt ?? a.createdAt,
    dateModified: a.updatedAt,
    mainEntityOfPage: buildCanonicalPath(a.slug),
  };
}

export function buildBreadcrumbJsonLd(a: Article): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'בית', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'מאמרים', item: '/articles/' },
      { '@type': 'ListItem', position: 3, name: a.title, item: buildCanonicalPath(a.slug) },
    ],
  };
}

/** relevant only for AI-generated placeholder drafts: never indexed until published, and never indexed at all while isPlaceholder (see src/pages/articles/[slug].astro, unchanged). */
export function isIndexable(a: Pick<Article, 'status' | 'isPlaceholder'>): boolean {
  return a.status === 'published' && !a.isPlaceholder;
}
