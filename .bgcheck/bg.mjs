// Verify which background is applied to .app-shell in light + dark (headless Chrome via CDP).
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const APP_URL = "http://localhost:5173/";
const API_URL = "http://localhost:5000/api";
const OUT = "c:\\Users\\sahil\\AppData\\Local\\Temp\\bgcheck";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function token() {
  const u = `bgtest${Date.now() % 10000}`;
  let r = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: "Bg@1234hg" }) }).catch(() => null);
  if (!r || !r.ok) {
    r = await fetch(`${API_URL}/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: "BG Test", username: u, password: "Bg@1234hg" }) });
    if (!r.ok) throw new Error("no token");
  }
  return await r.json();
}
function launch(port, dir) {
  return spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", "--no-default-browser-check", "--force-device-scale-factor=1", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
}
async function ws(port) {
  for (let i = 0; i < 60; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === "page" && !t.url.startsWith("devtools://")); if (p) return p.webSocketDebuggerUrl; } catch {}
    await sleep(500);
  }
  throw new Error("no cdp");
}
class CDP {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.pending = new Map(); this.ready = new Promise((res, rej) => { this.ws.addEventListener("open", res); this.ws.addEventListener("error", rej); }); this.ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && this.pending.has(m.id)) { const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } }); }
  async send(method, params = {}) { await this.ready; const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.pending.set(id, { res, rej })); }
  async eval(expression) { const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; }
}

const auth = await token();
const port = 9355;
const proc = launch(port, join(OUT, "profile-" + Date.now()));
const results = {};
try {
  const cdp = new CDP(await ws(port));
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Page.navigate", { url: APP_URL });
  await sleep(1500);
  await cdp.eval(`localStorage.setItem("companyDashboardAuth", ${JSON.stringify(JSON.stringify(auth))})`);
  await cdp.send("Page.navigate", { url: APP_URL });
  await sleep(2500);
  // wait for the app shell to mount
  for (let i = 0; i < 60; i++) {
    const has = await cdp.eval("!!document.querySelector('.app-shell')");
    if (has) break;
    await sleep(250);
  }

  const measure = `(() => {
    const r = (el) => { if (!el) return null; const cs = getComputedStyle(el); return { bgImage: cs.backgroundImage, bgColor: cs.backgroundColor }; };
    const shell = document.querySelector('.app-shell');
    const card = document.querySelector('.card');
    return { varVal: getComputedStyle(document.documentElement).getPropertyValue('--app-bg-gradient').trim(), shell: r(shell), card: r(card) };
  })()`;
  results.light = await cdp.eval(measure);
  // switch dark
  await cdp.eval(`document.documentElement.classList.add('dark')`);
  await sleep(300);
  results.dark = await cdp.eval(measure);
  console.log(JSON.stringify(results, null, 2));
  writeFileSync(join(OUT, "bg.json"), JSON.stringify(results, null, 2));
} finally {
  proc.kill();
}