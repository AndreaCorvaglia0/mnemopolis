// One painted scene of the story alone (story/scenes/), for looking at it while drawing:
//   node scripts/paintshot.mjs harbour '{"dock":1}' /tmp/x.png [w h dpr]   (needs npm run build first)
import puppeteer from 'puppeteer-core';
const [name, params = '{}', out = '/tmp/ps.png', w = '1440', hh = '800', d = '1'] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 200000, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: +w, height: +hh, deviceScaleFactor: +d });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + process.cwd() + '/dist/index.html?test&lite&arrived');
let t0 = Date.now(); while (Date.now() - t0 < 60000) { if (await p.evaluate(() => !!(window.__hb && window.__game?.scene.getScene('Town')?.player))) break; await new Promise((r) => setTimeout(r, 300)); }
await p.evaluate((n, pr) => __hb.story.paint(n, JSON.parse(pr)), name, params);
await new Promise((r) => setTimeout(r, +(process.env.WAIT || 2500)));
await p.screenshot({ path: out });
console.log(errs.length ? errs.join('\n') : 'ok');
await b.close();
