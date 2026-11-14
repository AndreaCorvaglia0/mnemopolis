// Pictures and checks of the front page (scripts/build-site.mjs), served under /mnemopolis/ like GitHub Pages.
//   node engine/scripts/siteshots.mjs <site dir> <out prefix>        e.g. site /tmp/site  -> /tmp/site-en-390.png ...
//   node engine/scripts/siteshots.mjs <site dir> <out.jpg> --og      the 1200x630 share picture (top of the English page)
// Also reports: requests that are not local, failed requests, horizontal overflow, images without alt.
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const [dir, out] = process.argv.slice(2), OG = process.argv.includes('--og');
const BASE = '/mnemopolis/';
const types = { '.html': 'text/html; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (!p.startsWith(BASE)) { res.writeHead(404); return res.end('outside base path'); }
  let f = path.join(path.resolve(dir), p.slice(BASE.length));
  if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
}).listen(0);
const port = server.address().port, origin = `http://localhost:${port}`;
const chrome = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function open(w, h, lang, dpr = 1) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, hasTouch: w < 500, isMobile: w < 500 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const bad = []; page.on('request', (r) => { if (!r.url().startsWith(origin) && !r.url().startsWith('data:')) bad.push('external: ' + r.url()); });
  page.on('requestfailed', (r) => bad.push('failed: ' + r.url())); page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  page.on('pageerror', (e) => bad.push('pageerror: ' + e.message));
  await page.evaluateOnNewDocument((l) => Object.defineProperty(navigator, 'language', { get: () => l }), lang === 'it' ? 'it-IT' : 'en-US');
  await page.goto(origin + BASE + (lang === 'it' ? 'it/' : '#en'), { waitUntil: 'networkidle0' });
  return { page, bad };
}
if (OG) {
  const { page } = await open(1200, 630, 'en');
  // a share card, not a page: no language button or link, the whole harbour under the title
  await page.addStyleTag({ content: '.sw,.textlink,.skip,.note{display:none!important}.hero{height:630px}.herotext{padding-top:34px}.hero .scene{position:absolute;left:0;bottom:0;height:330px;margin:0}h1{font-size:62px}.brand{font-size:20px}' });
  await page.screenshot({ path: out, type: 'jpeg', quality: 84 });
} else {
  for (const lang of ['en', 'it']) for (const [w, h] of [[390, 844], [820, 1180], [1440, 900]]) {
    const { page, bad } = await open(w, h, lang, w < 500 ? 2 : 1);
    await sleep(300);
    const info = await page.evaluate(() => ({ lang: document.documentElement.lang, over: document.documentElement.scrollWidth - innerWidth, noalt: [...document.images].filter((i) => !i.hasAttribute('alt')).length, size: document.documentElement.scrollHeight }));
    await page.screenshot({ path: `${out}-${lang}-${w}-top.png` });
    await page.screenshot({ path: `${out}-${lang}-${w}-full.png`, fullPage: true });
    console.log(lang, w, JSON.stringify(info), bad.join(' | ') || 'requests ok');
    await page.close();
  }
}
await browser.close(); server.close();
