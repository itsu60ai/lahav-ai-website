// Turns plain body text into safe inline HTML with real, clickable links.
//
// WHY THIS EXISTS: a block's text (Block['t']==='p'|'ul'|'quote') is stored
// as a plain string on purpose (see the comment at the top of types.ts) so
// writing an article never requires knowing markup. But the manual
// paste-back workflow (src/lib/ai/providers/manual.ts) gets its body text
// from a real Claude/ChatGPT reply, and those naturally write inline links
// as markdown: "כמו שמוסבר [כאן](https://example.com)". Rendering a block's
// text with plain {b.x} shows that literally, brackets and all, and the
// link never becomes clickable -- the exact bug reported.
//
// This is rendering-only: nothing about how blocks are stored changes, and
// a hand-written article with no links in it renders identically to before.
//
// Safety: the whole string is HTML-escaped FIRST, then only two patterns
// are re-opened as real markup -- a markdown link and a bare http(s) URL --
// and only when the target is http/https. Nothing else in the text can
// become markup, so a pasted reply can never inject a tag.
const ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPE[c]);
}

const MD_LINK = /\[([^\[\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BARE_URL = /(^|[\s(])(https?:\/\/[^\s<>"')]+)/g;

/**
 * Escapes `text` and re-opens markdown links and bare URLs as real <a>
 * tags. Returns an HTML string, meant for `set:html`, never for the DOM
 * directly from unescaped input.
 */
export function linkifyText(text: string): string {
  const escaped = escapeHtml(text ?? '');
  const withMdLinks = escaped.replace(
    MD_LINK,
    (_m, label: string, url: string) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
  );
  // Bare URLs left after markdown links are already converted (their own
  // URL is inside an href by now, so this pass only ever sees URLs that
  // were never wrapped in [label](...) to begin with).
  return withMdLinks.replace(
    BARE_URL,
    (_m, lead: string, url: string) => `${lead}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );
}
