// CURVE VERSUS TEXT.
//
// A <Curve> is absolutely positioned at `bottom: 100%` of the band it
// introduces, so it deliberately paints OVER the section above it. That
// is how the incoming band's colour carries across the seam, and it is
// also how it once cropped that section's last line of text, reported as
// "the text that is hidden beneath this blue thing".
//
// Run with scripts/probe.mjs. Returns [] when nothing collides.
//
// Two filters, both necessary, both learned from false positives:
//
//   · An element that has not entered yet still carries its reveal
//     translateY, so measuring it where it has not landed reports
//     collisions that never appear on screen.
//   · Fixed page furniture (the header, the dock) floats over the page
//     by design. A curve scrolling under the nav is not a collision.
//
// And the page is scrolled the way a visitor scrolls it, rather than
// measured once at the top, because reveals only resolve as they arrive.
const out = [];
const step = Math.round(innerHeight * 0.6);

const isFixed = (el) => {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (getComputedStyle(n).position === 'fixed') return true;
  }
  return false;
};

// The reveal transform is applied to the CARD, not to the label inside
// it, so checking only the leaf's own transform still measured elements
// that had not landed. Walk up.
const isMoving = (el) => {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (getComputedStyle(n).transform !== 'none') return true;
  }
  return false;
};

for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
  scrollTo(0, y);
  await new Promise((r) => setTimeout(r, 130));

  const curves = [...document.querySelectorAll('.curve')]
    .map((c) => [c, c.getBoundingClientRect()])
    .filter(([, r]) => r.bottom > -50 && r.top < innerHeight + 50);
  if (!curves.length) continue;

  for (const e of document.querySelectorAll(
    'p,h1,h2,h3,h4,span,a,li,small,strong,em,figcaption,label,td,th'
  )) {
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.12) continue;
    if (isMoving(e)) continue;
    if (isFixed(e)) continue;

    const r = e.getBoundingClientRect();
    if (r.height < 2 || r.width < 2) continue;

    for (const [c, cr] of curves) {
      if (c.contains(e)) continue;
      const ox = Math.min(r.right, cr.right) - Math.max(r.left, cr.left);
      const oy = Math.min(r.bottom, cr.bottom) - Math.max(r.top, cr.top);
      if (ox > 4 && oy > 6) {
        out.push({
          curve: c.parentElement.className.split(' ')[0],
          el: e.tagName + '.' + String(e.className).split(' ')[0],
          px: Math.round(oy),
          txt: e.textContent.trim().slice(0, 30),
        });
      }
    }
  }
}

const seen = new Set();
return out
  .filter((o) => {
    const k = o.curve + o.el + o.txt;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  })
  .slice(0, 8);
