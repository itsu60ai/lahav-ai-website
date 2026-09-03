// Tiny markdown-to-Block[] parser for the two /review/thailand-transport-*
// pages only. The two review pages carry their article body as a plain
// markdown string (## headers, blank-line-separated paragraphs) instead of
// hand-typed Block[] literals, so the copy stays easy to read and edit in
// the page source. Deliberately minimal: no nesting, no lists, no inline
// formatting beyond what ArticleView's own `p`/`h2` blocks already render.
// Not wired into the CMS or the admin editor -- those keep using real
// Block[] literals from the database, this is a one-off for two static
// external-review pages built from a copywriting-engine test.
import type { Block } from './cms/types';

export function parseReviewMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  const paras = md
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const para of paras) {
    if (para.startsWith('## ')) {
      blocks.push({ t: 'h2', x: para.slice(3).trim() });
    } else {
      blocks.push({ t: 'p', x: para });
    }
  }
  return blocks;
}
