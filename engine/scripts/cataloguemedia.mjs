// Pictures of a built game for the site's catalogue: the town at night and one lab.
//   node engine/scripts/cataloguemedia.mjs <built game .html> <outdir> <slug>
// Writes <outdir>/<slug>-town.webp and <slug>-lab.webp (960x540, about 40 to 90 kB each).
// No image library: Chrome takes the pictures at 1280x720, and a canvas in the same Chrome shrinks
// them and encodes WebP. Works for any course (the first core house's first lab is shown).
// Exit code 0 even if Chrome is missing or a picture fails: the front page has designed placeholders.
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const [html, outDir, slug] = process.argv.slice(2);
if (!html || !outDir || !slug) { console.error('usage: cataloguemedia.mjs <game.html> <outdir> <slug>'); process.exit(2); }
const CHROME = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!CHROME) { console.log('No Chrome found: catalogue pictures skipped.'); process.exit(0); }
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let browser;
try {
  browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 120000,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e.message).slice(0, 200)));
  await page.goto('file://' + (html.startsWith('/') ? html : process.cwd() + '/' + html) + '?lite&test&arrived');
  await sleep(9000);
  await page.evaluate('__hb.state.seenIntro=true'); await page.keyboard.press('Space'); await sleep(5000);

  // shrink and encode in the page, so that no image library is needed
  const encode = async (png) => {
    const b64 = Buffer.from(png).toString('base64');
    const out = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = 960; c.height = 540;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, 960, 540);
      return c.toDataURL('image/webp', 0.8).split(',')[1];
    }, b64);
    return Buffer.from(out, 'base64');
  };
  const save = async (name) => {
    const buf = await encode(await page.screenshot({ type: 'png' }));
    writeFileSync(`${outDir}/${slug}-${name}.webp`, buf);
    console.log(`${slug}-${name}.webp ${(buf.length / 1024).toFixed(0)} kB`);
  };

  // the town at night (the game's default), framed on the middle of the map at 16:9: the map is tall,
  // so a slice shows houses, lamps and the harbour better than the whole map would
  await page.evaluate(`(()=>{const s=__game.scene.getScene('Town');const c=s.cameras.main,b=c.getBounds();c.stopFollow();
    c.setZoom(1280/b.width*1.25);c.centerOn(b.width/2,b.height*FOCUS);return 1})()`.replace('FOCUS', process.env.FOCUS || '0.43'));
  await page.evaluate(`(__game.scene.getScene('UI').scene.setVisible(false),1)`); // no coins or tracker over the picture
  await sleep(2500);
  await save('town');
  await page.evaluate(`(__game.scene.getScene('UI').scene.setVisible(true),1)`);

  // one lab: the first core house's first station, with the game's own frame
  const id = await page.evaluate(`(()=>{const P=__hb.content.PLACES.filter(p=>!['museum','workshop'].includes(p.kind));return (P[0]||__hb.content.PLACES[0]).id})()`);
  await page.evaluate(`(__game.scene.getScene('Town').scene.start('Interior',{id:'${id}'}),1)`); await sleep(2500);
  await page.evaluate(`(__game.scene.getScene('UI').lab('${id}',0),1)`); await sleep(3000);
  await save('lab');
} catch (e) {
  console.log('catalogue pictures failed (the page will use placeholders):', String(e.message).slice(0, 300));
} finally {
  await browser?.close();
}
