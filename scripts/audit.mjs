// LAYOUT AUDIT.
//
// Walks every public route at three viewports and reports the classes of
// bug that are invisible to a type checker and tedious to catch by eye:
//
//   gap       a band of empty space inside a section, in px
//   ovf       horizontal overflow of the document
//   hidden    an element that carries reveal markup but never resolved,
//             so its content is invisible to a real visitor
//   overlap   two text blocks whose boxes intersect
//   underhdr  content sitting behind the fixed header
//   offscreen an element whose box escapes the viewport horizontally
//
// Usage:
//   node scripts/audit.mjs [baseUrl] [--json]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BASE = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://localhost:4330';
const AS_JSON = process.argv.includes('--json');

const ROUTES = [
  '/', '/services/', '/services/crm/', '/services/automations/',
  '/services/web-development/', '/services/app-development/', '/services/ai-content/',
  '/about/', '/articles/', '/articles/automation-worth-it/',
  '/contact/', '/faq/', '/privacy/', '/nope/',
];
const VIEWPORTS = [
  { name: 'mobile', w: 390, h: 844 },
  { name: 'tablet', w: 820, h: 1180 },
  { name: 'desktop', w: 1440, h: 900 },
];

// How big an empty band has to be before it counts as a bug. Editorial
// whitespace is intentional; 240px of nothing is not.
const GAP_LIMIT = 190;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('no chrome/edge found'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9222 + Math.floor(Math.random() * 900);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-'));
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--headless=new', '--hide-scrollbars', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--disable-extensions', '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore' });

async function wsUrl() {
  for (let i = 0; i < 80; i++) {
    try {
      const j = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('chrome did not start');
}

const ws = new WebSocket(await wsUrl());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
await S('Page.enable');
await S('Runtime.enable');

const PROBE = `(async () => {
  const de = document.documentElement;
  const HDR = 86;

  // let every scroll-triggered reveal fire
  const H = document.body.scrollHeight;
  for (let y = 0; y <= H; y += Math.round(innerHeight * 0.7)) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 90));
  }
  window.scrollTo(0, 0);
  // Past the reveal failsafe, so anything still invisible here is a real
  // bug and not a transient of the synthetic jump-scroll above.
  await new Promise(r => setTimeout(r, 2800));

  const label = el => (el.tagName + '.' + (el.className || '').toString().split(' ').filter(Boolean).slice(0,2).join('.')).slice(0, 46);

  // Fixed page furniture (dock, header, chat) floats OVER content by
  // design, so it can never be an overlap bug. Test ancestors, not just
  // the element, because the dock's children are statically positioned
  // inside a fixed parent.
  const inFixed = el => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (getComputedStyle(n).position === 'fixed') return true;
    }
    return false;
  };
  // Same idea for clipping: an element may bleed past the viewport as
  // long as SOME ancestor clips it.
  const clipped = el => {
    for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const o = getComputedStyle(n);
      if (['hidden', 'clip', 'auto', 'scroll'].includes(o.overflowX)) return true;
    }
    return false;
  };
  const res = { ovf: de.scrollWidth - de.clientWidth, gaps: [], hidden: [], overlap: [], underhdr: [], offscreen: [] };

  // ---- gaps: empty vertical bands inside a top-level section
  const main = document.querySelector('main');
  if (main) for (const sec of main.children) {
    const r = sec.getBoundingClientRect();
    if (r.height < 40) continue;
    // Anything that actually paints something: a leaf box, or any element
    // carrying its own text. Counting only childless elements missed every
    // heading that contains a <br>, which then read as a 250px "gap".
    const leaves = [...sec.querySelectorAll('*')].filter(e => {
      const k = e.getBoundingClientRect();
      if (k.height <= 0 || k.width <= 0) return false;
      if (getComputedStyle(e).visibility === 'hidden') return false;
      if (['IMG', 'SVG', 'CANVAS', 'VIDEO', 'INPUT', 'TEXTAREA', 'SELECT', 'HR'].includes(e.tagName)) return true;
      if (!e.children.length) return true;
      // has a direct text node of its own
      return [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
    });
    const spans = leaves.map(e => { const k = e.getBoundingClientRect(); return [k.top + scrollY, k.bottom + scrollY]; })
      .sort((a, b) => a[0] - b[0]);
    let cursor = r.top + scrollY, worst = 0, at = 0;
    for (const [t, b] of spans) { if (t - cursor > worst) { worst = t - cursor; at = cursor; } cursor = Math.max(cursor, b); }
    if (r.bottom + scrollY - cursor > worst) { worst = r.bottom + scrollY - cursor; at = cursor; }
    if (worst > ${GAP_LIMIT}) res.gaps.push({ el: label(sec), px: Math.round(worst), at: Math.round(at) });
  }

  // ---- reveal states that never resolved
  document.querySelectorAll('[data-reveal], .mo-line, [data-clip], [data-scale-in]').forEach(el => {
    if (el.classList.contains('is-in')) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    // Only a bug if the element is ACTUALLY invisible. A pending reveal
    // whose computed opacity is already 1 harms nobody.
    const cs = getComputedStyle(el);
    if (parseFloat(cs.opacity) > 0.05 && cs.visibility !== 'hidden') return;
    res.hidden.push({ el: label(el), y: Math.round(r.top + scrollY) });
  });

  // ---- text blocks whose boxes intersect
  const texts = [...document.querySelectorAll('h1,h2,h3,p,li,a,button,span')].filter(e => {
    const t = (e.textContent || '').trim();
    if (!t || t.length < 3) return false;
    if (e.querySelector('h1,h2,h3,p,li')) return false;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.opacity === '0') return false;
    if (inFixed(e)) return false;
    if (e.closest('[hidden]') || e.closest('.avtalk') || e.closest('.menu') || e.closest('.mega')) return false;
    // Oversized watermarks are a deliberate device: aria-hidden, behind
    // the content, and at 3-10% opacity. Their boxes cross text on
    // purpose, exactly as the reference's giant section words do.
    if (e.matches('.t-ghost, .nf__ghost, .blocks__ghost') || e.closest('.t-ghost, .nf__ghost')) return false;
    // A category chip sits ON a cover image on purpose, over its own
    // scrim. So does anything inside that cover.
    if (e.matches('.feat__chip, .card-a__chip') || e.closest('.feat__art, .card-a__art')) return false;
    const r = e.getBoundingClientRect();
    return r.width > 24 && r.height > 8;
  }).slice(0, 400);
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ox > 14 && oy > 10) {
        res.overlap.push({ a: label(a), b: label(b), y: Math.round(ra.top + scrollY) });
        j = texts.length;
      }
    }
    if (res.overlap.length > 6) break;
  }

  // ---- first screen content hidden behind the fixed header
  document.querySelectorAll('main h1, main h2, main p, main img, main svg').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.top < HDR && r.bottom > 6 && scrollY < 4) {
      res.underhdr.push({ el: label(el), top: Math.round(r.top) });
    }
  });

  // ---- boxes escaping the viewport horizontally
  document.querySelectorAll('body *').forEach(el => {
    if (inFixed(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    if (r.right > de.clientWidth + 2 || r.left < -2) {
      if (clipped(el)) return;
      res.offscreen.push({ el: label(el), l: Math.round(r.left), r: Math.round(r.right) });
    }
  });

  res.hidden = res.hidden.slice(0, 6);
  res.underhdr = res.underhdr.slice(0, 4);
  res.offscreen = res.offscreen.slice(0, 4);
  return res;
})()`;

const report = [];
for (const vp of VIEWPORTS) {
  await S('Emulation.setDeviceMetricsOverride', {
    width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.w < 768,
  });
  for (const route of ROUTES) {
    await S('Page.navigate', { url: BASE + route });
    await new Promise((resolve) => {
      const t = setTimeout(resolve, 20000);
      ws.addEventListener('message', function onMsg(ev) {
        const m = JSON.parse(ev.data);
        if (m.method === 'Page.loadEventFired') { clearTimeout(t); ws.removeEventListener('message', onMsg); resolve(); }
      });
    });
    await S('Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }).catch(() => {});
    await sleep(400);
    const out = await S('Runtime.evaluate', { expression: PROBE, awaitPromise: true, returnByValue: true });
    const v = out.result?.value ?? { error: JSON.stringify(out.exceptionDetails ?? {}).slice(0, 200) };
    report.push({ vp: vp.name, route, ...v });
  }
}

ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}

if (AS_JSON) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

let problems = 0;
for (const r of report) {
  const bits = [];
  if (r.ovf > 0) bits.push(`ovf ${r.ovf}`);
  if (r.gaps?.length) bits.push('gap ' + r.gaps.map((g) => `${g.px}@${g.at}(${g.el})`).join(' '));
  if (r.hidden?.length) bits.push('HIDDEN ' + r.hidden.map((h) => `${h.el}@${h.y}`).join(' '));
  if (r.overlap?.length) bits.push('OVERLAP ' + r.overlap.map((o) => `${o.a}|${o.b}@${o.y}`).join(' '));
  if (r.underhdr?.length) bits.push('UNDERHDR ' + r.underhdr.map((u) => u.el).join(' '));
  if (r.offscreen?.length) bits.push('OFFSCREEN ' + r.offscreen.map((o) => `${o.el}[${o.l},${o.r}]`).join(' '));
  if (r.error) bits.push('ERR ' + r.error);
  if (bits.length) { problems++; console.log(`${r.vp.padEnd(8)} ${r.route.padEnd(32)} ${bits.join(' | ')}`); }
}
console.log(problems ? `\n${problems} route/viewport combinations with findings` : '\nclean');
process.exit(0);
