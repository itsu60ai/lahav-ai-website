// A TRUE WYSIWYG surface for the article body: one contenteditable canvas
// where headings, paragraphs, lists and quotes are real formatted elements
// — no visible ##, no [[תמונה 1]] markers, nothing typed as syntax.
//
// WHY THIS EXISTS: the first version of "continuous text editing"
// (src/lib/cms/blocktext.ts) replaced the tiny-box-per-block editor with a
// single textarea, but it still asked a non-technical person to type
// markdown-ish syntax (## for a heading, [[תמונה 1]] for a photo). The
// client's own words: "זה ממש לא כמו WORD... נראה לך שאני אתחיל לכתוב ככה
// מאמרים?" (this isn't like Word at all — you think I'm going to start
// writing articles like this?). This module is the actual fix: a small
// toolbar applies formatting to a real editable document, the way Word or
// Google Docs does, and photos/videos/code sit in the flow as visible
// cards, not bracket markers.
//
// blocktext.ts is left in place and still used by nothing removed from
// this file's job — the two are independent; this one is what the editor
// page now drives.
import type { Block } from './types.ts';
import { youtubeIdFrom } from './types.ts';

const MD_LINK = /\[([^\[\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

/**
 * Same job as `ParentNode.append(...)` (accepts strings or nodes, any
 * count) but built on `appendChild`. NOT a style preference: this
 * project's Cloudflare Workers types declare their own global `Element`
 * interface for HTMLRewriter, and TypeScript merges it with the DOM's, so
 * every DOM element's inherited `.append()` resolves to HTMLRewriter's
 * incompatible overload (`append(content: string | ReadableStream |
 * Response, options?)`) instead of the real one. `appendChild` lives on
 * `Node`, which Workers-types does not redeclare, so it is unaffected.
 */
function appendAll(parent: Node, ...nodes: (Node | string)[]) {
  for (const n of nodes) parent.appendChild(typeof n === 'string' ? document.createTextNode(n) : n);
}

/** Blocks that render as a fixed, non-typable card rather than text. */
type ChipBlock = Extract<Block, { t: 'img' | 'aiviz' | 'viz' | 'yt' | 'shot' }>;

function isChip(b: Block): b is ChipBlock {
  return b.t === 'img' || b.t === 'aiviz' || b.t === 'viz' || b.t === 'yt' || b.t === 'shot';
}

// ─────────────────────────────────────────── blocks -> DOM

/** Builds real child nodes for `text`, turning `[label](url)` into an
 *  actual `<a>` so the canvas shows a clickable link, not brackets. */
function fillInline(el: HTMLElement, text: string) {
  let last = 0;
  MD_LINK.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_LINK.exec(text))) {
    if (m.index > last) appendAll(el, text.slice(last, m.index));
    const a = document.createElement('a');
    a.href = m[2];
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = m[1];
    appendAll(el, a);
    last = m.index + m[0].length;
  }
  if (last < text.length) appendAll(el, text.slice(last));
  if (el.childNodes.length === 0) appendAll(el, document.createElement('br')); // stay clickable when empty
}

function textBlockEl(tag: 'p' | 'h2' | 'h3' | 'blockquote', text: string): HTMLElement {
  const el = document.createElement(tag);
  fillInline(el, text);
  return el;
}

function listEl(items: string[]): HTMLElement {
  const ul = document.createElement('ul');
  const rows = items.length ? items : [''];
  for (const item of rows) {
    const li = document.createElement('li');
    fillInline(li, item);
    ul.appendChild(li);
  }
  return ul;
}

const CHIP_LABEL: Record<ChipBlock['t'], string> = {
  img: 'תמונה',
  aiviz: 'תרשים AI',
  viz: 'תרשים',
  yt: 'סרטון YouTube',
  shot: 'צילום מסך נדרש',
};

/**
 * A chip is one atomic, non-typable row in the flow: a photo, an AI
 * diagram, or a video. `contenteditable="false"` on the shell makes the
 * browser treat it as a single unit for selection, Backspace and Delete —
 * you cannot type inside one by accident, and deleting it takes the whole
 * card, never half of it.
 *
 * The full block JSON lives on `data-block`, not rebuilt from the visible
 * preview, so a photo can never lose a field (its media id, an AI
 * diagram's SVG) just because the canvas only shows a thumbnail of it.
 */
function chipEl(b: ChipBlock): HTMLElement {
  const shell = document.createElement('div');
  shell.contentEditable = 'false';
  shell.className = 'bc-chip bc-chip--' + b.t;
  shell.dataset.block = JSON.stringify(b);

  const bar = document.createElement('div');
  bar.className = 'bc-chip__bar';
  const label = document.createElement('span');
  label.className = 'bc-chip__label';
  label.textContent = CHIP_LABEL[b.t];
  const up = iconBtn('↑', 'העלאה', 'up');
  const down = iconBtn('↓', 'הורדה', 'down');
  const del = iconBtn('✕', 'הסרה', 'del');
  appendAll(bar, label, up, down, del);
  shell.appendChild(bar);

  if (b.t === 'img') {
    const img = document.createElement('img');
    img.className = 'bc-chip__img';
    img.src = b.src;
    img.alt = b.alt || '';
    img.loading = 'lazy';
    shell.appendChild(img);

    // Same reasoning as the video caption below: editable right here, not
    // only in "בלוקים", so a photo missing its description is something
    // you actually notice while writing, not something you find later.
    const altIn = document.createElement('input');
    altIn.className = 'bc-chip__cap';
    altIn.placeholder = 'תיאור התמונה (חשוב לנגישות ולגוגל)';
    altIn.value = b.alt || '';
    altIn.dataset.imgAlt = '1';
    const capIn = document.createElement('input');
    capIn.className = 'bc-chip__cap';
    capIn.placeholder = 'כיתוב מתחת לתמונה (לא חובה)';
    capIn.value = b.caption || '';
    const sync = () => {
      img.alt = altIn.value;
      shell.dataset.block = JSON.stringify({ ...b, alt: altIn.value, caption: capIn.value });
    };
    altIn.addEventListener('input', sync);
    capIn.addEventListener('input', sync);
    // A REAL, visible line, not just a placeholder inside an empty field --
    // a placeholder is easy to miss entirely while typing elsewhere in the
    // article, and a manually-uploaded photo's caption arrives a few
    // seconds later from a network call (src/lib/ai/caption.ts). Without
    // this, the caption genuinely did land, but nothing on screen said so;
    // the only way to notice was to leave and come back.
    const status = document.createElement('span');
    status.className = 'bc-chip__status';
    status.dataset.imgStatus = '1';
    appendAll(shell, altIn, capIn, status);
  } else if (b.t === 'aiviz') {
    const box = document.createElement('div');
    box.className = 'bc-chip__svg';
    box.innerHTML = b.svg; // already validated upstream (isSvgSafe) before ever reaching a draft
    shell.appendChild(box);
  } else if (b.t === 'viz') {
    const note = document.createElement('p');
    note.className = 'bc-chip__note';
    note.textContent = 'התרשים שנבחר בהגדרות המאמר.';
    shell.appendChild(note);
  } else if (b.t === 'yt') {
    const frame = document.createElement('div');
    frame.className = 'bc-chip__yt';
    if (b.id) {
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + b.id;
      f.loading = 'lazy';
      f.allow = 'encrypted-media; picture-in-picture';
      frame.appendChild(f);
    } else {
      const note = document.createElement('p');
      note.className = 'bc-chip__note';
      note.textContent = 'אין קישור לסרטון.';
      frame.appendChild(note);
    }
    shell.appendChild(frame);

    // Visible AND editable here -- not just in the "בלוקים" tab -- because
    // a video the AI embedded already carries a caption (see manual.ts /
    // attachYoutubeCaptions), and with no way to see it in this canvas
    // there was no way to tell it was even there, let alone fix it.
    const capIn = document.createElement('input');
    capIn.className = 'bc-chip__cap';
    capIn.placeholder = 'כיתוב לסרטון (מה רואים בו) — לא חובה, אבל מומלץ';
    capIn.value = b.caption || '';
    capIn.addEventListener('input', () => {
      shell.dataset.block = JSON.stringify({ ...b, caption: capIn.value, title: capIn.value });
    });
    shell.appendChild(capIn);
  } else if (b.t === 'shot') {
    // Requested verbatim by the client: the AI's own step-by-step Hebrew
    // instructions shown right here, plus an upload control at the exact
    // spot the photo belongs — nothing to figure out, nothing to move
    // afterward. The actual upload (network call) is wired from the
    // editor page via the [data-shot-upload] input this builds; this
    // module stays free of fetch calls, same as every other chip here.
    const box = document.createElement('div');
    box.className = 'bc-shot';
    const note = document.createElement('p');
    note.className = 'bc-shot__note';
    note.textContent = b.instructions;
    const row = document.createElement('label');
    row.className = 'bc-shot__upload';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.dataset.shotUpload = '1';
    const btnText = document.createElement('span');
    btnText.textContent = '📷 העלאת התמונה כאן';
    const status = document.createElement('span');
    status.className = 'bc-shot__status';
    status.dataset.shotStatus = '1';
    appendAll(row, btnText, input);
    appendAll(box, note, row, status);
    shell.appendChild(box);
  }

  return shell;
}

function iconBtn(label: string, title: string, action: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'bc-icon';
  b.textContent = label;
  b.title = title;
  b.dataset.chipAction = action;
  return b;
}

/**
 * The one typable "chip": a code sample. The shell (border, language
 * label, delete button) is non-editable, but the `<code>` inside it is a
 * NESTED contenteditable region — a standard, well-supported pattern for
 * "an editable island inside a non-editable card". Language is a small
 * text input in the bar, not typed inline.
 */
function codeChipEl(b: Extract<Block, { t: 'code' }>): HTMLElement {
  const shell = document.createElement('div');
  shell.contentEditable = 'false';
  shell.className = 'bc-chip bc-chip--code';

  const bar = document.createElement('div');
  bar.className = 'bc-chip__bar';
  const label = document.createElement('span');
  label.className = 'bc-chip__label';
  label.textContent = 'קטע קוד';
  const lang = document.createElement('input');
  lang.className = 'bc-chip__lang';
  lang.placeholder = 'שפה (לא חובה)';
  lang.value = b.lang || '';
  lang.dataset.codeLang = '1';
  const up = iconBtn('↑', 'העלאה', 'up');
  const down = iconBtn('↓', 'הורדה', 'down');
  const del = iconBtn('✕', 'הסרה', 'del');
  appendAll(bar, label, lang, up, down, del);

  const pre = document.createElement('pre');
  pre.className = 'bc-chip__pre';
  pre.dir = 'ltr';
  const code = document.createElement('code');
  code.contentEditable = 'true';
  code.dataset.codeText = '1';
  code.textContent = b.code || '';
  pre.appendChild(code);

  appendAll(shell, bar, pre);
  return shell;
}

export function buildCanvas(container: HTMLElement, blocks: Block[]) {
  container.replaceChildren();
  for (const b of blocks) {
    if (isChip(b)) container.appendChild(chipEl(b));
    else if (b.t === 'code') container.appendChild(codeChipEl(b));
    else if (b.t === 'h2') container.appendChild(textBlockEl('h2', b.x));
    else if (b.t === 'h3') container.appendChild(textBlockEl('h3', b.x));
    else if (b.t === 'quote') container.appendChild(textBlockEl('blockquote', b.x));
    else if (b.t === 'ul') container.appendChild(listEl(b.items));
    else container.appendChild(textBlockEl('p', (b as { x?: string }).x ?? ''));
  }
  if (container.children.length === 0) container.appendChild(document.createElement('p'));
}

// ─────────────────────────────────────────── DOM -> blocks

/** `<a>` becomes `[label](url)`; anything else contributes its own text
 *  only — bold/italic/spans a paste might have smuggled in are dropped to
 *  plain text rather than silently corrupting the stored string. */
function inlineText(el: Node): string {
  let out = '';
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) out += node.textContent ?? '';
    else if (node.nodeType === Node.ELEMENT_NODE) {
      const e = node as HTMLElement;
      if (e.tagName === 'A') {
        const href = e.getAttribute('href') ?? '';
        const label = e.textContent ?? '';
        out += href && label ? `[${label}](${href})` : label;
      } else if (e.tagName === 'BR') {
        out += ' ';
      } else {
        out += inlineText(e);
      }
    }
  }
  return out;
}

export function readCanvas(container: HTMLElement): Block[] {
  const blocks: Block[] = [];
  for (const el of Array.from(container.children) as HTMLElement[]) {
    if (el.classList.contains('bc-chip')) {
      if (el.classList.contains('bc-chip--code')) {
        const code = el.querySelector<HTMLElement>('[data-code-text]');
        const langInput = el.querySelector<HTMLInputElement>('[data-code-lang]');
        // contenteditable sometimes substitutes U+00A0 (non-breaking space) for an ordinary space -- normalise it back so a code sample's indentation stays correct.
        const text = (code?.textContent ?? '').replace(/ /g, ' ');
        if (text.trim()) {
          blocks.push({ t: 'code', code: text, lang: (langInput?.value ?? '').trim(), caption: '' });
        }
        continue;
      }
      try {
        const b = JSON.parse(el.dataset.block ?? 'null') as Block | null;
        if (b) blocks.push(b);
      } catch {
        // A chip whose data-block failed to parse is dropped rather than
        // guessed at — same reasoning as a stray [[תמונה N]] marker in the
        // text-mode editor: never insert the wrong asset.
      }
      continue;
    }
    const tag = el.tagName;
    if (tag === 'H2') {
      const x = inlineText(el).trim();
      if (x) blocks.push({ t: 'h2', x });
    } else if (tag === 'H3') {
      const x = inlineText(el).trim();
      if (x) blocks.push({ t: 'h3', x });
    } else if (tag === 'BLOCKQUOTE') {
      const x = inlineText(el).trim();
      if (x) blocks.push({ t: 'quote', x });
    } else if (tag === 'UL' || tag === 'OL') {
      const items = Array.from(el.querySelectorAll(':scope > li'))
        .map((li) => inlineText(li).trim())
        .filter(Boolean);
      if (items.length) blocks.push({ t: 'ul', items });
    } else {
      // P, DIV, or whatever the browser used for a plain line — all of
      // them are body text as far as this editor is concerned.
      const x = inlineText(el).trim();
      if (x) blocks.push({ t: 'p', x });
    }
  }
  return blocks;
}

/** Re-reads a chip's own `data-block` and returns the parsed block, or
 *  null. Used by the ↑/↓/✕ handlers, which act on one chip at a time. */
export function chipBlock(el: HTMLElement): Block | null {
  try {
    return JSON.parse(el.dataset.block ?? 'null');
  } catch {
    return null;
  }
}

/** Builds a fresh code chip and returns it, for the "+ קוד" toolbar button. */
export function newCodeChip(): HTMLElement {
  return codeChipEl({ t: 'code', code: '', lang: '', caption: '' });
}

/** Builds a fresh YouTube chip from a pasted URL, or null if it does not
 *  resolve to a video id. For the "+ סרטון" toolbar button. `caption`
 *  becomes both the visible caption under the player and its accessible
 *  title — same field the AI is asked to fill in when it embeds a video,
 *  so a manually-added one is not the only kind left without one. */
export function newYoutubeChip(url: string, caption = ''): HTMLElement | null {
  const id = youtubeIdFrom(url);
  if (!id) return null;
  return chipEl({ t: 'yt', id, title: caption, caption });
}

/**
 * Builds the real photo chip that replaces a `shot` placeholder once its
 * screenshot has been uploaded — same media-library URL shape `img`
 * blocks always use (`/api/media/<id>`). The editor page calls this right
 * after a successful upload and swaps it in for the placeholder chip.
 */
export function imageChipFromMedia(mediaId: string, alt: string): HTMLElement {
  return chipEl({ t: 'img', src: `/api/media/${mediaId}`, alt, caption: '' });
}
