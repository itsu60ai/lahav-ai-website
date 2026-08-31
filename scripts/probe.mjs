// Companion to shot.mjs: evaluates an expression in a real headless page
// and prints the JSON result. Used to check computed geometry and colours
// when a screenshot shows something is wrong but not why.
//
// Usage:
//   node scripts/probe.mjs <url> "<js expression>" [width] [height] [scrollY] [waitMs]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const [, , url, expr, wArg, hArg, scrollArg, waitArg] = process.argv;
if (!url || !expr) {
  console.error('usage: node scripts/probe.mjs <url> "<expr>" [w] [h] [scrollY] [waitMs]');
  process.exit(1);
}
const width = Number(wArg || 1440);
const height = Number(hArg || 900);
const scrollY = Number(scrollArg || 0);
const waitMs = Number(waitArg || 1500);

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('no chrome/edge found'); process.exit(1); }

const port = 9222 + Math.floor(Math.random() * 900);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-'));
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--headless=new', '--hide-scrollbars', '--disable-gpu',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--force-device-scale-factor=1', `--window-size=${width},${height}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const j = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('chrome did not expose a debugging endpoint');
}

const ws = new WebSocket(await getWsUrl());
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
await S('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
await S('Page.navigate', { url });
await new Promise((resolve) => {
  const t = setTimeout(resolve, 20000);
  ws.addEventListener('message', function onMsg(ev) {
    const m = JSON.parse(ev.data);
    if (m.method === 'Page.loadEventFired') { clearTimeout(t); ws.removeEventListener('message', onMsg); resolve(); }
  });
});
await S('Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }).catch(() => {});
if (scrollY) await S('Runtime.evaluate', { expression: `window.scrollTo(0, ${scrollY});` });
await sleep(waitMs);

const res = await S('Runtime.evaluate', {
  // async wrapper so probes can await animations and timers
  expression: `(async()=>{ const v = await (async()=>{ ${expr} })(); return JSON.stringify(v, null, 2); })()`,
  returnByValue: true,
  awaitPromise: true,
});
console.log(res.exceptionDetails ? JSON.stringify(res.exceptionDetails, null, 2) : res.result.value);

ws.close();
chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
