// Reliable full-page / viewport screenshots via headless Chrome + CDP.
//
// The editor's preview pane proved unreliable for this work (it returned
// blank frames for pages that were provably rendering), and this redesign
// is judged visually, so QA needs a capture path that cannot silently lie.
// This drives real Chrome over the DevTools protocol and waits for the
// page to actually settle before capturing.
//
// Usage:
//   node scripts/shot.mjs <url> <out.png> [width] [height] [scrollY] [waitMs]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const [, , url, out, wArg, hArg, scrollArg, waitArg] = process.argv;
if (!url || !out) {
  console.error('usage: node scripts/shot.mjs <url> <out.png> [w] [h] [scrollY] [waitMs]');
  process.exit(1);
}
const width = Number(wArg || 1440);
const height = Number(hArg || 900);
const scrollY = Number(scrollArg || 0);
const waitMs = Number(waitArg || 1500);

const CHROME =
  ['C:/Program Files/Google/Chrome/Application/chrome.exe',
   'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
   'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('no chrome/edge found'); process.exit(1); }

const port = 9222 + Math.floor(Math.random() * 900);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shot-'));

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--headless=new',
  '--hide-scrollbars',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--force-device-scale-factor=1',
  `--window-size=${width},${height}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const j = await res.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('chrome did not expose a debugging endpoint');
}

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  const sessions = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  return { send, sessions };
}

const wsUrl = await getWsUrl();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
const { send } = cdp(ws);

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

const S = (m, p) => send(m, p, sessionId);

await S('Page.enable');
await S('Runtime.enable');
await S('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: 1, mobile: width < 768,
});

await S('Page.navigate', { url });
// wait for load
await new Promise((resolve) => {
  const t = setTimeout(resolve, 20000);
  ws.addEventListener('message', function onMsg(ev) {
    const m = JSON.parse(ev.data);
    if (m.method === 'Page.loadEventFired') { clearTimeout(t); ws.removeEventListener('message', onMsg); resolve(); }
  });
});

// let fonts, motion and any scroll-triggered reveals settle
await S('Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }).catch(() => {});
if (scrollY) {
  await S('Runtime.evaluate', { expression: `window.scrollTo(0, ${scrollY});` });
}
if (process.env.SHOT_CLICK) {
  await S('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(process.env.SHOT_CLICK)})?.click()` });
  await sleep(700);
}
await sleep(waitMs);
// nudge a repaint so nothing is captured mid-composite
await S('Runtime.evaluate', {
  expression: `void document.body.offsetHeight; requestAnimationFrame(()=>requestAnimationFrame(()=>{}));`,
});
await sleep(250);

const { data } = await S('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(data, 'base64'));
console.log(`shot ${width}x${height} y=${scrollY} -> ${out}`);

ws.close();
chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
