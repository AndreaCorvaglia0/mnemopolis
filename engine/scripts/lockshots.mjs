// Pictures of locks and upper floors (src/mechanics/riddles/, src/mechanics/floors/): a room with
// stairs and a lock, the stairs refused without the key, the upper floor, each close-up before
// typing, a miss with the thought, a success with what is inside, and (phone) the close-up with the
// keyboard open. Run after a build: npm run shots:locks   (PHONE=1 for a phone held upright)
// OUT2=/tmp copies them there as locks-*.png (locks-phone-*.png on a phone).
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PHONE = !!process.env.PHONE;
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'shots', PHONE ? 'locks-phone' : 'locks');
const chrome = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chrome) { console.log('No Chrome: nothing checked on screen.'); process.exit(0); }
for (const f of existsSync(out) ? readdirSync(out) : []) if (f.endsWith('.png')) rmSync(path.join(out, f));
mkdirSync(out, { recursive: true });
const { RIDDLES } = await import('../src/mechanics/riddles/data.js');
const { PLACES } = await import('../src/data/content.js');
const { floorsOf } = await import('../src/mechanics/floors/plan.js');
const DUEL = existsSync(path.join(here, '..', 'src', 'mechanics', 'duel', 'index.js'));
if (!RIDDLES.length) { console.log('This course has no riddles: nothing to show.'); process.exit(0); }
const enc = encodeURIComponent, I = "__game.scene.getScene('Interior')", UI = "__game.scene.getScene('UI')";
const cur = "__game.scene.getScenes(true).map(s=>s.sys.settings.key)[0]";
const start = (from, id, floor = 'ground') => `eval:${enc(`(__game.scene.getScene(${from === 'Town' ? "'Town'" : "'Interior'"}).scene.start('Interior',{id:'${id}',floor:'${floor}'}),1)`)}`;
// stand in front of a thing (x, y: its tile) and face it
const before = (x, y) => `eval:${enc(`(()=>{const s=${I};s.player.tx=${x};s.player.ty=${y + 1};s.player.place();s.player.face('up');return 1})()`)}`;
const lockAt = (id) => `${I}.room.locks.find(l=>l.id==='${id}')`;
const standLock = (id) => `eval:${enc(`(()=>{const s=${I},l=${lockAt(id)};if(!l)return 'no lock ${id} here';s.player.tx=l.x;s.player.ty=l.y+1;s.player.place();s.player.face('up');return 1})()`)}`;
const use = `eval:${enc(`(${I}.interact(),1)`)}`;
const type = (txt) => `eval:${enc(`(()=>{const i=document.querySelector('.lk input');if(i){i.value=${JSON.stringify(String(txt))};i.dispatchEvent(new Event('input'));return 1}const pad=[...document.querySelectorAll('.lk-pad button')];for(const ch of ${JSON.stringify(String(txt))}){const b=pad.find(x=>x.textContent===ch);b&&b.click()}return 1})()`)}`;
const tryIt = `eval:${enc("(document.querySelector('.lk-try').click(),1)")}`;
const close = `eval:${enc("(()=>{const b=document.querySelector('.lk-back');b&&b.click();return 1})()")}`;
const thought = `eval:${enc("(()=>{const t=document.querySelector('.lk-think');return 'thought: '+(t&&!t.hidden?t.textContent:'none')})()")}`;
const prompt = `eval:${enc(`'prompt: '+${UI}.promptText`)}`;
const bubble = `eval:${enc(`(()=>{const t=${UI}.__thought;return 'bubble: '+(t&&t.c?t.c.list[1].text:'none')})()`)}`;
const wrong = (r) => (r.type === 'number' || typeof [].concat(r.answer)[0] === 'number' ? '99' : 'purple');
const right = (r) => String([].concat(r.answer)[0]);

const steps = ['wait:9000', `eval:${enc('(__hb.state.seenIntro=true,__hb.state.keys={},__hb.state.locks={},__hb.state.tries={},1)')}`, 'key:Space', 'wait:5000'];
let from = 'Town';
const upHouse = PLACES.find((p) => floorsOf(p).up && p.kind !== 'workshop' && p.kind !== 'museum');
// 1. a room with stairs (and its lock, if any), the player at the foot of the stairs: the key mark
if (upHouse) {
  steps.push(start(from, upHouse.id), 'wait:2400'); from = 'Interior';
  steps.push(`eval:${enc(`(()=>{const s=${I},t=s.room.stairs;s.player.tx=t.x;s.player.ty=t.y+1;s.player.place();s.player.face('up');return 1})()`)}`, 'wait:900', prompt, 'shot:01-stairs-room');
  // 2. the stairs without the key
  steps.push(use, 'wait:700', bubble, 'shot:02-stairs-refused');
  // 3. with the key: upstairs
  if (DUEL) { // the real way: win the house duel, the owner hands over the key, then the stairs
    const Q = "(()=>{const id=document.querySelector('.dl')?.dataset.q;return __hb.content.QUESTIONS.find(q=>q.id===id)})()", mode = "document.querySelector('.dl')?.dataset.mode";
    const right = `(()=>{const q=${Q};document.querySelectorAll('.dl-o')[q.answer].click();return 1})()`, next = "(document.querySelector('.dl-b.go')?.click(),1)";
    steps.push(`eval:${enc(`(${I}.quizSeries(),1)`)}`, 'wait:1500', `eval:${enc(`(()=>{let n=0;while(${mode}!=='end'&&n++<40){if(${mode}==='q')(${right});else (${next});}return 'duel: '+${mode}})()`)}`, 'wait:900',
      `eval:${enc("'key after the duel: '+!!__hb.state.keys['" + upHouse.id + "']")}`, `eval:${enc(next)}`, 'wait:1500', 'key:Escape', 'wait:600', 'key:Space', 'wait:600', 'key:Escape', 'wait:800',
      `eval:${enc(`(()=>{const s=${I},t=s.room.stairs;if(!t)return 'already upstairs (a Space after the duel used the stairs)';s.player.tx=t.x;s.player.ty=t.y+1;s.player.place();s.player.face('up');return 1})()`)}`, 'wait:600');
  } else steps.push(`eval:${enc(`__hb.giveKey('${upHouse.id}')`)}`, 'wait:300');
  steps.push(prompt, use, 'wait:2600', `eval:${enc(`'now in '+${cur}+' floor '+${I}.floor`)}`, 'shot:03-upstairs');
}
// 4. every lock: before typing, a miss (three for the first, to see the thought escalate), the right answer
RIDDLES.forEach((r, i) => {
  const n = String(4 + i * 3).padStart(2, '0');
  steps.push(start(from, r.place, r.where === 'room' ? 'ground' : 'up'), 'wait:2400', standLock(r.id), 'wait:600', prompt);
  if (i === 0) steps.push(`shot:${n}-${r.kind}-room`);
  steps.push(use, 'wait:1600', `shot:${n}-${r.kind}-closeup`);
  steps.push(type(wrong(r)), tryIt, 'wait:1400', thought);
  if (i === 0) steps.push(type('blue'), tryIt, 'wait:1300', type('green'), tryIt, 'wait:1300', thought);
  steps.push(`shot:${String(+n + 1).padStart(2, '0')}-${r.kind}-miss`);
  if (PHONE && i === 0 && r.kind !== 'safe') {
    // the keyboard open: the visible height drops to about 470 px
    steps.push(`eval:${enc("(document.querySelector('.lk input')?.focus(),1)")}`, 'resize:390:470', 'wait:900', `shot:${String(+n + 1).padStart(2, '0')}b-${r.kind}-keyboard`, 'resize:390:844', 'wait:600');
  }
  steps.push(type(right(r)), tryIt, 'wait:3600', `shot:${String(+n + 2).padStart(2, '0')}-${r.kind}-open`, close, 'wait:800');
  from = 'Interior';
});
// the discoveries page lists what was opened
steps.push(`eval:${enc('(__hb.journal(),1)')}`, 'wait:1000', 'shot:30-journal', 'key:Escape', 'wait:400');
// the advanced station, opened from upstairs
const adv = PLACES.find((p) => floorsOf(p).advanced.length);
if (adv) steps.push(`eval:${enc(`(${UI}.page(()=>__hb.openLab('${adv.id}',0,{upper:${JSON.stringify(floorsOf(adv).advanced.map((s) => s.id))}})),1)`)}`, 'wait:2200', 'shot:31-advanced-station', 'key:Escape', 'wait:500');
// back down the stairs
if (upHouse) steps.push(start(from, upHouse.id, 'up'), 'wait:2200', `eval:${enc(`(()=>{const s=${I};s.leave();return 1})()`)}`, 'wait:2200', `eval:${enc(`'after the stairs down: '+${cur}+' floor '+${I}.floor+', player at '+${I}.player.tx+','+${I}.player.ty`)}`, 'shot:32-back-down');

const r = spawnSync('node', [path.join(here, 'shoot.mjs'), path.join(here, '..', 'dist', 'index.html'), out, steps.join(',')], { stdio: 'inherit', env: { ...process.env, VP: PHONE ? '390x844x2' : '1440x800x1', Q: PHONE ? '?lite&test&touch&arrived' : '?lite&test&arrived' } });
if (process.env.OUT2) for (const f of readdirSync(out)) if (f.endsWith('.png')) copyFileSync(path.join(out, f), path.join(process.env.OUT2, `locks${PHONE ? '-phone' : ''}-${f}`));
console.log(`Pictures are in ${out}. Open them.`);
process.exit(r.status || 0);
