// Converts an article body between the stored block array and one
// continuous piece of text a person can just type into.
//
// WHY THIS EXISTS: the article body is stored as structured blocks, and the
// only way to edit it was one small box per block with ↑ ↓ ✕ buttons.
// Writing a 900-word article that way is miserable — you cannot see the
// article, you cannot select a sentence across two paragraphs, and adding a
// heading in the middle means clicking a button and dragging a box up
// fourteen times. This module lets the same body be edited as ordinary
// text, the way every other CMS works, without changing how it is stored.
//
// THE ROUND-TRIP RULE: blocksToText -> textToBlocks must lose nothing. A
// block that cannot be expressed as text (a photo, an AI-drawn diagram)
// is written out as a short marker line and restored from the original
// block it came from, so switching modes can never silently delete a
// picture. That is the one property this module must never break.
import type { Block } from './types.ts';
import { youtubeIdFrom } from './types.ts';

/** Marker text for the block kinds a person cannot type. Kept Hebrew and
 *  human-readable so a marker in the middle of the text explains itself. */
const MARKERS = {
  img: 'תמונה',
  aiviz: 'תרשים-AI',
  viz: 'תרשים',
} as const;

/** Blocks that survive the round-trip by reference rather than by text. */
export type PreservedBlock = Extract<Block, { t: 'img' | 'aiviz' | 'viz' }>;

export interface BlocksToTextResult {
  text: string;
  /** The non-typable blocks, in the order their markers appear in `text`. */
  preserved: PreservedBlock[];
}

function isPreserved(b: Block): b is PreservedBlock {
  return b.t === 'img' || b.t === 'aiviz' || b.t === 'viz';
}

export function blocksToText(blocks: Block[]): BlocksToTextResult {
  const preserved: PreservedBlock[] = [];
  const parts: string[] = [];

  for (const b of blocks ?? []) {
    if (isPreserved(b)) {
      preserved.push(b);
      // 1-based: the number a person sees matches "the third picture".
      parts.push(`[[${MARKERS[b.t]} ${preserved.length}]]`);
      continue;
    }
    switch (b.t) {
      case 'h2':
        parts.push(`## ${b.x}`);
        break;
      case 'h3':
        parts.push(`### ${b.x}`);
        break;
      case 'quote':
        parts.push(`> ${b.x}`);
        break;
      case 'ul':
        parts.push((b.items ?? []).map((i) => `- ${i}`).join('\n'));
        break;
      case 'yt':
        parts.push(`https://www.youtube.com/watch?v=${b.id}`);
        break;
      case 'code': {
        const fence = longestFenceIn(b.code);
        parts.push(`${fence}${b.lang ?? ''}\n${b.code}\n${fence}`);
        break;
      }
      default:
        parts.push((b as { x?: string }).x ?? '');
    }
  }
  return { text: parts.join('\n\n').trim(), preserved };
}

/**
 * A code sample can itself contain a ``` line (an article about markdown,
 * for instance). Open with one backtick more than the longest run inside,
 * which is the standard way out and keeps the round-trip exact.
 */
function longestFenceIn(code: string): string {
  let longest = 2;
  for (const m of (code ?? '').matchAll(/`{3,}/g)) longest = Math.max(longest, m[0].length);
  return '`'.repeat(longest + 1);
}

const MARKER_RE = /^\[\[\s*(תמונה|תרשים-AI|תרשים)\s*(\d*)\s*\]\]$/;

/**
 * Parses edited text back into blocks.
 *
 * `preserved` is the array from the matching blocksToText call. A marker
 * whose number has no entry (the person mangled or invented one) is
 * dropped rather than guessed at — silently inserting the wrong photo
 * would be worse than losing a marker the editor can see is gone.
 */
export function textToBlocks(text: string, preserved: PreservedBlock[] = []): Block[] {
  const blocks: Block[] = [];
  let pBuf: string[] = [];
  let listBuf: string[] = [];

  const flushP = () => {
    const x = pBuf.join('\n').trim();
    if (x) blocks.push({ t: 'p', x });
    pBuf = [];
  };
  const flushList = () => {
    if (listBuf.length) blocks.push({ t: 'ul', items: listBuf.slice() });
    listBuf = [];
  };
  const flushAll = () => {
    flushP();
    flushList();
  };

  let fenceMark = '';
  let fenceLang = '';
  let fenceBuf: string[] = [];

  for (const raw of (text ?? '').split(/\r?\n/)) {
    const line = raw.trim();

    if (fenceMark) {
      // Only a fence at least as long as the opener closes it.
      if (new RegExp(`^\`{${fenceMark.length},}\\s*$`).test(line)) {
        const code = fenceBuf.join('\n').replace(/\s+$/, '');
        if (code.trim()) blocks.push({ t: 'code', code, lang: fenceLang, caption: '' });
        fenceMark = '';
        fenceLang = '';
        fenceBuf = [];
      } else {
        fenceBuf.push(raw);
      }
      continue;
    }

    const open = line.match(/^(`{3,})\s*([A-Za-z0-9+#._-]*)\s*$/);
    if (open) {
      flushAll();
      fenceMark = open[1];
      fenceLang = (open[2] || '').toLowerCase();
      continue;
    }

    if (!line) {
      flushAll();
      continue;
    }

    const marker = line.match(MARKER_RE);
    if (marker) {
      flushAll();
      const idx = Number(marker[2]) - 1;
      const original = preserved[idx];
      // Type must match too: a person who renamed the marker should not
      // get a different asset than the one the number points at.
      if (original && MARKERS[original.t] === marker[1]) blocks.push(original);
      continue;
    }

    let m: RegExpMatchArray | null;
    if ((m = line.match(/^##\s+(.+)/))) {
      flushAll();
      blocks.push({ t: 'h2', x: m[1].trim() });
    } else if ((m = line.match(/^###\s+(.+)/))) {
      flushAll();
      blocks.push({ t: 'h3', x: m[1].trim() });
    } else if ((m = line.match(/^>\s?(.*)/))) {
      flushAll();
      blocks.push({ t: 'quote', x: m[1].trim() });
    } else if ((m = line.match(/^[-*]\s+(.+)/))) {
      flushP();
      listBuf.push(m[1].trim());
    } else {
      const ytId = wholeLineYoutubeId(line);
      if (ytId) {
        flushAll();
        blocks.push({ t: 'yt', id: ytId, title: '', caption: '' });
        continue;
      }
      flushList();
      pBuf.push(line);
    }
  }

  if (fenceMark) {
    // Unterminated fence: keep what was typed rather than dropping it.
    const code = fenceBuf.join('\n').replace(/\s+$/, '');
    if (code.trim()) blocks.push({ t: 'code', code, lang: fenceLang, caption: '' });
  }
  flushAll();
  return blocks;
}

/** A line that is nothing but a YouTube link (bare, or a markdown link). */
function wholeLineYoutubeId(line: string): string | null {
  const bare = line.match(/^(?:\[[^\]]*\]\()?(\S+?)\)?$/);
  if (!bare) return null;
  // A bare 11-character word is not a video link; require a real URL here,
  // or the word "בוקרטובקר" would become an embedded player.
  if (!/^https?:\/\//i.test(bare[1])) return null;
  return youtubeIdFrom(bare[1]);
}
