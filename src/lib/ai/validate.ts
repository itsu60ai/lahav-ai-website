// Validates a provider's output before anything downstream trusts it.
// Two jobs: the shape is usable (so a malformed reply fails loudly instead
// of corrupting a draft), and any SVG it carries is safe to render. This
// matters even in MOCK mode for consistency, and matters a great deal once
// a real model writes the SVG (Stage D) — a model can be prompted to avoid
// script tags, but code must not merely hope it complied.
import type { Block } from '../cms/types.ts';
import type { GeneratorOutput } from './types.ts';

const DANGEROUS_SVG_PATTERN = /<script|on\w+\s*=|javascript:|<foreignObject/i;

export function isSvgSafe(svg: string): boolean {
  return !DANGEROUS_SVG_PATTERN.test(svg);
}

// 'aiviz' was MISSING from this set until 2026-09-03, and that one omission
// silently broke the engine's best output. The parser turns a [DIAGRAM]
// marker into an 'aiviz' block exactly when the model supplied a usable
// SVG, so every generation that actually produced a real diagram failed
// validation with "רכיבי תוכן בפורמט לא תקין" and threw the whole article
// away. The only generations that ever passed were the ones whose diagram
// was missing or rejected -- which is precisely backwards.
const VALID_BLOCK_TYPES = new Set(['p', 'h2', 'h3', 'quote', 'ul', 'viz', 'aiviz', 'img']);

function isValidBlock(b: unknown): b is Block {
  if (!b || typeof b !== 'object') return false;
  const t = (b as any).t;
  if (!VALID_BLOCK_TYPES.has(t)) return false;
  if (t === 'ul') return Array.isArray((b as any).items);
  if (t === 'viz') return true;
  if (t === 'img') {
    // Only our own media route. An article must never be able to hotlink
    // an arbitrary external URL into the page.
    const src = (b as any).src;
    return typeof src === 'string' && src.startsWith('/api/media/');
  }
  if (t === 'aiviz') {
    // Shape AND safety: an aiviz block carries raw markup that will be
    // rendered with set:html, so it is checked here as well as at render
    // time in ArticleView.astro.
    const svg = (b as any).svg;
    return typeof svg === 'string' && svg.trim().length > 0 && isSvgSafe(svg);
  }
  return typeof (b as any).x === 'string';
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateGeneratorOutput(output: GeneratorOutput): ValidationResult {
  const errors: string[] = [];

  if (!output.title?.trim()) errors.push('כותרת חסרה');
  if (!Array.isArray(output.body) || output.body.length === 0) errors.push('גוף הכתבה חסר');
  else {
    const bad = output.body.filter((b) => !isValidBlock(b));
    if (bad.length > 0) errors.push(`${bad.length} רכיבי תוכן בפורמט לא תקין`);
  }

  if (!output.seo?.slug) errors.push('כתובת URL (slug) חסרה');
  if (!output.seo?.metaDescription) errors.push('meta description חסר');

  if (output.visual?.svgMarkup && !isSvgSafe(output.visual.svgMarkup)) {
    errors.push('קובץ ה-SVG שנוצר מכיל תוכן לא בטוח ונדחה');
  }

  return { ok: errors.length === 0, errors };
}
