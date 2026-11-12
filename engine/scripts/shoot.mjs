// Drive the built game in headless Chrome and take screenshots.
// Usage: node shoot.mjs <html> <outdir> "<steps>"
// steps: comma-separated: wait:ms | key:Name | hold:Name:ms | shot:name | eval:js | resize:w:h
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

// Chrome is found in the usual places; set CHROME=/path/to/chrome if yours is elsewhere.
const CHROME = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);

const [html, outDir, stepsArg] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 150000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
// VP=WIDTHxHEIGHTxDPR, e.g. 1440x800x2 for a Retina laptop window.
const [vw, vh, vd] = (process.env.VP || '1280x720x1').split('x').map(Number);
await page.setViewport({ width: vw, height: vh, deviceScaleFactor: vd || 1 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`[pageerror] ${(e.stack || e.message).slice(0, 600)}`));
await page.goto('file://' + html + (process.env.Q || ''));
const steps = stepsArg.split(',').map((s) => s.trim()).filter(Boolean);
for (const s of steps) {
  const [cmd, a, b] = s.split(':');
  if (cmd === 'wait') await new Promise((r) => setTimeout(r, +a));
  else if (cmd === 'key') { await page.keyboard.press(a); await new Promise((r) => setTimeout(r, 120)); }
  else if (cmd === 'hold') { await page.keyboard.down(a); await new Promise((r) => setTimeout(r, +b)); await page.keyboard.up(a); await new Promise((r) => setTimeout(r, 120)); }
  else if (cmd === 'shot') await page.screenshot({ path: `${outDir}/${a}.png` });
  else if (cmd === 'resize') { await page.setViewport({ width: +a, height: +b, deviceScaleFactor: vd || 1 }); await new Promise((r) => setTimeout(r, 400)); }
  else if (cmd === 'walk') { // walk:Key:<encoded js condition>  hold the key until the condition is true (max 12 s)
    await page.keyboard.down(a); const t0 = Date.now(); let ok = false;
    while (Date.now() - t0 < 12000 && !(ok = await page.evaluate(decodeURIComponent(b)))) await new Promise((r) => setTimeout(r, 60));
    await page.keyboard.up(a); await new Promise((r) => setTimeout(r, 500));
    logs.push(`[walk ${a}] ${ok ? 'ok' : 'TIMEOUT'}`);
  }
  else if (cmd === 'mouse') { await page.mouse.move(+a, +b, { steps: 6 }); await new Promise((r) => setTimeout(r, 150)); }
  else if (cmd === 'mdown') await page.mouse.down();
  else if (cmd === 'mup') await page.mouse.up();
  else if (cmd === 'auto') {
    // auto:ms[:phaseA+phaseB]  Play through dialogue and quizzes (right answer, "Fairly sure"),
    // screenshot the first frame of each listed phase, stop after 2.5 s with nothing open.
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const until = Date.now() + +a, want = new Set((b || '').split('+').filter(Boolean)), seen = new Set();
    let idleSince = null;
    while (Date.now() < until) {
      const p = await page.evaluate('__hb.probe()');
      if (p.phase && want.has(p.phase) && !seen.has(p.phase)) { seen.add(p.phase); await sleep(900); await page.screenshot({ path: `${outDir}/auto-${p.phase}.png` }); }
      if (!p.phase) { if (!p.busy) { idleSince ??= Date.now(); if (Date.now() - idleSince > 2500) break; } await sleep(250); continue; }
      idleSince = null;
      if (p.phase === 'quiz-choose') await page.keyboard.press(p.sel === p.answer ? 'Space' : 'ArrowDown');
      else if (p.phase === 'quiz-bet') await page.keyboard.press('Digit2');
      else if (p.phase !== 'encounter' && p.phase !== 'title') await page.keyboard.press('Space');
      await sleep(380);
    }
    logs.push(`[auto] ${JSON.stringify(await page.evaluate('__hb.probe()'))}`);
  }
  else if (cmd === 'eval') { let r; try { r = await page.evaluate(decodeURIComponent(a)); } catch (e) { r = 'EVAL ERROR ' + e.message.slice(0, 200); } if (r !== undefined) logs.push(`[eval] ${JSON.stringify(r)}`); }
}
console.log(logs.filter((l) => l !== "[eval] 1" && l !== "[eval] true").slice(0, 80).join('\n') || 'no console errors');
await browser.close();
