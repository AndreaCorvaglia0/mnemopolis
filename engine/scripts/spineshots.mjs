// Pictures of the main path (src/mechanics/quest/): the guide's first speech, the town with the
// tracker at the start, the mark over the next house, the three tabs of the menu in mid-game (two
// houses done), a room's tracker, the League refused, the champion stepping aside, the ending card,
// and free roaming afterwards.
// Run after a build: node scripts/spineshots.mjs   (PHONE=1 for a phone held upright)
// OUT2=/tmp copies the pictures there as spine-*.png (spine-phone-*.png on a phone).
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PHONE = !!process.env.PHONE;
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'shots', PHONE ? 'spine-phone' : 'spine');
const chrome = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chrome) { console.log('No Chrome: nothing checked on screen.'); process.exit(0); }
for (const f of existsSync(out) ? readdirSync(out) : []) if (f.endsWith('.png')) rmSync(path.join(out, f));
mkdirSync(out, { recursive: true });
const { Q } = await import('../src/mechanics/quest/active.js');
const { BUILDINGS } = await import('../src/world/townMap.js');
const enc = encodeURIComponent, T = "__game.scene.getScene('Town')", UI = "__game.scene.getScene('UI')";
const core = Q.core, extra = Q.extra;
const go = (x, y, dir = 'up') => `eval:${enc(`(()=>{const s=${T};s.player.tx=${x};s.player.ty=${y};s.player.place();s.player.face('${dir}');s.cameras.main.startFollow(s.player.sprite);s.showWhere(${x},${y});return 1})()`)}`;
// a save with the first two core houses done (visited, every station, badge), one extra seen from nearby
const doneOf = (ps) => Object.fromEntries(ps.flatMap((p) => Array.from({ length: p.lab?.stations?.length || 0 }, (_, i) => [`${p.id}:${i}`, true])));
const mid = core.slice(0, 2), all = core;
const setState = (ps, extraFields = '') => `eval:${enc(`(()=>{const S=__hb.state;S.seenIntro=true;S.visited=${JSON.stringify(Object.fromEntries(ps.map((p) => [p.id, true])))};S.done=${JSON.stringify(doneOf(ps))};S.stamps=${JSON.stringify(Object.fromEntries(ps.map((p) => [p.id, true])))};S.seen=${JSON.stringify(Object.fromEntries(extra.slice(0, 1).map((p) => [p.id, true])))};${extraFields}${UI}.refreshQuest(true);${UI}.refreshHUD();return 'step: '+JSON.stringify(${UI}.quest.kind)+' '+${UI}.trackFull})()`)}`;
const next = core[2] || core[core.length - 1], nb = BUILDINGS.find((b) => b.id === next.id), lg = BUILDINGS.find((b) => b.league);
const steps = [
  'wait:9000', 'key:Space', 'wait:3200', 'shot:00-guide-goal',
  'auto:20000',
  `eval:${enc(`'tracker at the start: '+${UI}.trackFull`)}`, 'shot:01-start',
  // "What should I do now?" asked of the guide
  `eval:${enc(`(()=>{const s=${T},g=s.npcs.find((n)=>n.def.id==='guide');s.player.tx=g.tx-1;s.player.ty=g.ty;s.player.place();s.player.face('right');s.talk(g);return 1})()`)}`, 'wait:1800', 'key:Space', 'wait:2200', 'shot:01b-what-now', 'key:Escape', 'wait:800',
  setState(mid), go(nb.doors[0][0], nb.doors[0][1] + 4), 'wait:1500', 'shot:02-mid-mark',
  `eval:${enc(`(${UI}.showAtlas(),1)`)}`, 'wait:1000', 'shot:03-menu-journey',
  'key:Digit2', 'wait:700', 'shot:04-menu-map',
  `eval:${enc("(document.querySelector('.qm-body .qm-btn.ghost').click(),1)")}`, 'wait:600', 'shot:05-menu-mindmap',
  'key:Digit3', 'wait:700', 'shot:06-menu-mysteries',
  'key:Escape', 'wait:600',
  // a room: the tracker speaks of the lab there
  `eval:${enc(`(${T}.scene.start('Interior',{id:'${next.id}'}),1)`)}`, 'wait:2500', `eval:${enc(`'in the room: '+${UI}.trackFull`)}`, 'shot:07-room',
  `eval:${enc(`(__game.scene.getScene('Interior').scene.start('Town',{from:'${next.id}'}),1)`)}`, 'wait:2000',
  // the League refused
  go(lg.doors[0][0], lg.doors[0][1] + 1), 'wait:1200', `eval:${enc(`(${T}.league(),1)`)}`, 'wait:2500', 'shot:08-league-refused', 'auto:8000',
  // the League won: the champion steps aside, the ending card
  setState(all, "S.passedLeague=true;S.q={a:{seen:5,right:4,last:1},b:{seen:4,right:3,last:1},c:{seen:3,right:3,last:1}};S.bets={1:[1,2],2:[4,5],3:[5,5]};S.played=2940;"),
  `eval:${enc(`(${T}.league(),1)`)}`, 'wait:3000', 'shot:09-champion', 'auto:9000', `walk:Shift:${enc(`__hb.state.ended&&!!document.querySelector('.qe')`)}`, 'wait:1000', 'shot:10-ending-card',
  'key:Escape', 'wait:1200', `eval:${enc(`'after the ending: '+${UI}.trackFull+' ended='+__hb.state.ended`)}`, 'shot:11-free-roaming',
  `eval:${enc(`(${UI}.showAtlas('journey'),1)`)}`, 'wait:900', 'shot:12-journey-after', 'key:Escape', 'wait:500',
];
const r = spawnSync('node', [path.join(here, 'shoot.mjs'), path.join(here, '..', 'dist', 'index.html'), out, steps.join(',')], { stdio: 'inherit', env: { ...process.env, VP: process.env.VP || (PHONE ? '390x844x2' : '1440x800x1'), Q: PHONE ? '?lite&test&touch' : '?lite&test' } });
if (process.env.OUT2) for (const f of readdirSync(out)) if (f.endsWith('.png')) copyFileSync(path.join(out, f), path.join(process.env.OUT2, `spine-${PHONE ? 'phone-' : ''}${f}`));
console.log(`Pictures are in ${out}${process.env.OUT2 ? ` and ${process.env.OUT2}/spine-${PHONE ? 'phone-' : ''}*.png` : ''}.`);
process.exit(r.status || 0);
