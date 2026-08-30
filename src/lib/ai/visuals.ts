// The visual layer. See docs/AI_ENGINE.md section 7: the recommended
// output is SVG generated as code, on the site's own design tokens, never
// a raster image API. Stage A produces a real, on-brand placeholder SVG —
// not a raster mock — with real, descriptive alt text, so the entire image
// pipeline (filename, alt text, dimensions, gating) is provably working
// end to end before any provider ever writes the diagram itself.
//
// This is deliberately NOT wired into the public article template yet
// (src/components/ArticleView.astro only renders the existing block types).
// Doing that safely is a Stage C decision — see the Stage A completion
// notes in docs/AI_ENGINE.md.
import type { AssetKind, Brief, VisualAsset } from './types.ts';

// Same three brand colours as src/styles/global.css @theme, and the same
// approach as the hand-built diagrams: navy/royal/electric on a light card,
// never a photographic or "glowing AI" look.
const NAVY = '#0b1530';
const ROYAL = '#1d4ed8';
const ELECTRIC = '#2997ff';
const COOL = '#f2f4f7';
const INK_3 = '#6b7793';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** wraps text onto lines of roughly maxChars, for placing inside an SVG <text> */
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

function placeholderSvg(title: string, kindLabel: string, width: number, height: number): string {
  const lines = wrap(title, 22);
  const lineHeight = 56;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const textEls = lines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${startY + i * lineHeight}" text-anchor="middle" font-family="Heebo, Arial, sans-serif" font-size="40" font-weight="800" fill="${NAVY}">${escapeXml(line)}</text>`
    )
    .join('\n    ');

  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(title)}">
  <rect width="${width}" height="${height}" fill="${COOL}" />
  <rect x="0" y="0" width="${width}" height="10" fill="url(#lahav-ai-grad)" />
  <defs>
    <linearGradient id="lahav-ai-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${NAVY}" />
      <stop offset="1" stop-color="${ELECTRIC}" />
    </linearGradient>
  </defs>
  <g>
    ${textEls}
  </g>
  <text x="${width / 2}" y="${height - 40}" text-anchor="middle" font-family="Assistant, Arial, sans-serif" font-size="22" font-weight="700" fill="${ROYAL}">${escapeXml(kindLabel)}</text>
  <text x="${width - 24}" y="${height - 14}" text-anchor="end" font-family="Assistant, Arial, sans-serif" font-size="14" fill="${INK_3}">תמונה לדוגמה, טרם נוצרה תמונה סופית</text>
</svg>`;
}

const DIMENSIONS: Record<AssetKind, { width: number; height: number }> = {
  hero: { width: 1200, height: 630 },
  diagram: { width: 860, height: 480 },
  inline: { width: 640, height: 360 },
};

function filenameFor(slug: string, kind: AssetKind): string {
  return `${slug || 'article'}-${kind}.svg`;
}

/**
 * The MOCK visual: an honest, on-brand placeholder, not a disguised final
 * image. isPlaceholder semantics apply the same way as placeholder article
 * text does — never presented as finished creative work.
 */
export function generateMockVisual(args: {
  brief: Brief;
  kindLabel: string;
  slug: string;
  kind?: AssetKind;
}): Omit<VisualAsset, 'id'> {
  const kind: AssetKind = args.kind ?? 'hero';
  const { width, height } = DIMENSIONS[kind];
  const svgMarkup = placeholderSvg(args.brief.topic, args.kindLabel, width, height);
  return {
    kind,
    format: 'svg',
    filename: filenameFor(args.slug, kind),
    // Real, descriptive alt text — even a placeholder is described honestly
    // rather than left generic, since alt text is a completeness gate.
    altText: `תרשים ממותג לכתבה בנושא ${args.brief.topic}, בהמתנה ליצירת תמונה סופית`,
    caption: '',
    width,
    height,
    svgMarkup,
    source: 'mock',
  };
}
