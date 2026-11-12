// Smoke test with pictures. Builds must exist (npm run build). Run: npm run shots
// It opens the game in headless Chrome and saves to ./shots:
//   the town from above, a real walk into the first house and out again (the player must be able
//   to move afterwards), every room, every lab station, every reading page, the map.
// LOOK at the pictures afterwards: a build that compiles can still be wrong on screen.
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { COURSE } from '../src/course/course.js';
import { LABS } from '../src/course/labs.js';
import { MAP_W, MAP_H, BUILDINGS } from '../src/world/townMap.js';

// PHONE=1 runs the same tour on a phone held upright (390 x 844, touch mode) into shots/phone.
const PHONE = !!process.env.PHONE;
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'shots', ...(PHONE ? ['phone'] : []));
const chrome = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!chrome || !existsSync(chrome)) { console.log('No Chrome or Chromium found (set CHROME=/path/to/it). Screenshots skipped: nothing was checked on screen.'); process.exit(0); }
if (!existsSync(path.join(here, '..', 'dist', 'index.html'))) { console.log('No build yet: run the build first.'); process.exit(1); }
for (const f of existsSync(out) ? readdirSync(out) : []) if (f.endsWith('.png')) rmSync(path.join(out, f));
mkdirSync(out, { recursive: true });
const enc = (js) => encodeURIComponent(js);
const places = COURSE.districts.flatMap((d) => d.places);
const scene = (p) => (p.kind === 'workshop' ? 'Workshop' : p.kind === 'museum' ? 'Museum' : 'Interior');
const cur = "__game.scene.getScenes(true).map(s=>s.sys.settings.key)[0]";
const first = BUILDINGS.find((b) => b.id === places[0].id), [dx, dy] = first.doors[0];
const steps = [
  'wait:9000', `eval:${enc('__hb.state.seenIntro=true')}`, 'key:Space', 'wait:6000', 'shot:00-start',
  // the whole town from above, in daylight
  `eval:${enc(`(()=>{const s=__game.scene.getScene('Town');s.tod='night';s.cycleTime();const c=s.cameras.main;c.stopFollow();c.setZoom(Math.max(0.5,Math.min(1,1400/(${MAP_W}*16),760/(${MAP_H}*16))));c.centerOn(${MAP_W}*8,${MAP_H}*8);return 1})()`)}`, 'wait:2200', 'shot:01-town',
  // walk into the first house and out again
  `eval:${enc(`(()=>{const s=__game.scene.getScene('Town');s.layout();s.cameras.main.startFollow(s.player.sprite);s.player.tx=${dx};s.player.ty=${dy + 2};s.player.place();return 1})()`)}`, 'wait:600',
  `walk:ArrowUp:${enc(`${cur}==='${scene(places[0])}'&&!__hb.probe().busy`)}`, 'wait:1200', 'shot:02-entered',
  `walk:ArrowDown:${enc(`${cur}==='Town'&&!__hb.probe().busy`)}`, 'wait:1000', 'hold:ArrowDown:700',
  `eval:${enc(`(()=>{const s=__game.scene.getScene('Town');return 'after leaving: player at '+s.player.tx+','+s.player.ty+' (door at ${dx},${dy}; must be at least 2 below)'})()`)}`, 'shot:03-back-in-town',
];
let from = 'Town';
places.forEach((p, i) => {
  const n = String(i + 1).padStart(2, '0');
  steps.push(`eval:${enc(`(__game.scene.getScene('${from}').scene.start('${scene(p)}',{id:'${p.id}'}),1)`)}`, 'wait:2200', `shot:${n}-${p.id}-room`);
  from = scene(p);
  const lab = LABS[p.id];
  if (lab) lab.stations.forEach((_, k) => steps.push(`eval:${enc(`(__game.scene.getScene('UI').lab('${p.id}',${k}),1)`)}`, 'wait:2200', `shot:${n}-${p.id}-lab${k + 1}`, 'key:Escape', 'wait:500'));
  if (p.kind !== 'museum') steps.push(`eval:${enc(`(__game.scene.getScene('UI').reading('${p.id}'),1)`)}`, 'wait:1500', `shot:${n}-${p.id}-page`, 'key:Escape', 'wait:500');
  else steps.push(`eval:${enc(`(__game.scene.getScene('UI').plaque(__hb.content.PLACE['${p.id}'].timeline,0,__hb.content.PLACE['${p.id}'].kinds),1)`)}`, 'wait:1000', `shot:${n}-${p.id}-plaque`, 'key:Escape', 'wait:500');
});
steps.push(`eval:${enc("(__game.scene.getScene('UI').showAtlas(),1)")}`, 'wait:1200', 'shot:98-map', 'key:Escape', 'wait:500', `eval:${enc('__hb.gallery()')}`, 'wait:600', 'shot:99-gallery');
const r = spawnSync('node', [path.join(here, 'shoot.mjs'), path.join(here, '..', 'dist', 'index.html'), out, steps.join(',')], { stdio: 'inherit', env: { ...process.env, VP: process.env.VP || (PHONE ? '390x844x2' : '1440x800x1'), Q: PHONE ? '?lite&test&touch' : '?lite&test' } });
console.log(`Pictures are in ${out}. Open them.`);
process.exit(r.status || 0);
