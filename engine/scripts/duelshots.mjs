// Pictures of the duels (src/mechanics/duel/): a house duel at the start, after a hit, after a miss
// with the rebuttal, won with the key handed over, lost with the advice; the League mid-way.
// Run after a build: node scripts/duelshots.mjs   (PHONE=1 for a phone held upright)
// OUT2=/tmp copies the pictures there as duel-*.png (duel-phone-*.png on a phone).
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PHONE = !!process.env.PHONE;
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'shots', PHONE ? 'duel-phone' : 'duel');
const chrome = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chrome) { console.log('No Chrome: nothing checked on screen.'); process.exit(0); }
for (const f of existsSync(out) ? readdirSync(out) : []) if (f.endsWith('.png')) rmSync(path.join(out, f));
mkdirSync(out, { recursive: true });
const { PLACES } = await import('../src/data/content.js');
const enc = encodeURIComponent;
// a house with an Interior scene (labs and homes), with an expert if there is one
const inner = PLACES.filter((p) => !['workshop', 'museum'].includes(p.kind) && (p.questions || []).length >= 2);
const A = (inner.find((p) => p.expert) || inner[0]).id, B = (inner.find((p) => p.id !== A) || inner[0]).id;
const cur = "__game.scene.getScenes(true).map(s=>s.sys.settings.key)[0]";
const Q = "(()=>{const id=document.querySelector('.dl')?.dataset.q;return __hb.content.QUESTIONS.find(q=>q.id===id)})()";
const mode = "document.querySelector('.dl')?.dataset.mode";
const right = `(()=>{const q=${Q};document.querySelectorAll('.dl-o')[q.answer].click();return 1})()`;
// a wrong option, one with a trap when the question has one
const wrong = `(()=>{const q=${Q};const t=q.options.map((_,i)=>i).filter(i=>i!==q.answer);const i=t.find(i=>q.traps&&q.traps[i])??t[0];document.querySelectorAll('.dl-o')[i].click();return 1})()`;
const next = "(document.querySelector('.dl-b.go').click(),1)";
// play until the end: right answers (or wrong ones)
const playOut = (ok) => `(()=>{let n=0;while(${mode}!=='end'&&n++<40){if(${mode}==='q')(${ok ? right : wrong});else (${next});}return ${mode}})()`;
const duel = (id) => `(()=>{const s=__game.scene.getScene('Interior');s.quizSeries();return 1})()`;
const steps = ['wait:9000', `eval:${enc('__hb.state.seenIntro=true')}`, 'key:Space', 'wait:5000',
  `eval:${enc(`(()=>{const s=__game.scene.getScene('Town');s.scene.start('Interior',{id:'${A}'});return 1})()`)}`, 'wait:2500',
  // 1. the start: opening line, the question
  `eval:${enc(duel(A))}`, 'wait:1200', 'shot:01-house-start',
  // 2. a right answer
  `eval:${enc(right)}`, 'wait:500', 'shot:02-house-hit',
  // 3. a wrong answer: the rebuttal with the trap
  `eval:${enc(next)}`, 'wait:300', `eval:${enc(wrong)}`, 'wait:500', 'shot:03-house-miss',
  // 4. right until won: the key handed over
  `eval:${enc(next)}`, 'wait:200', `eval:${enc(playOut(true))}`, 'wait:900', 'shot:04-house-won',
  `eval:${enc("(()=>{const r={stamps:{...__hb.state.stamps},keys:{...__hb.state.keys}};return 'after the win: '+JSON.stringify(r)})()")}`,
  `eval:${enc("(document.querySelector('.dl-b.go').click(),1)")}`, 'wait:1200', 'shot:05-house-badge', 'key:Space', 'wait:800',
  // 5. a friendly rematch: no new key
  `eval:${enc(duel(A))}`, 'wait:1000', 'shot:06-friendly-start', `eval:${enc(playOut(true))}`, 'wait:600', 'shot:07-friendly-won',
  `eval:${enc("(()=>'friendly: '+document.querySelectorAll('.dl-prize').length+' prizes shown')()")}`, 'key:Escape', 'wait:800',
  // 6. another house, lost: the advice, Rematch / Not now
  `eval:${enc(`(()=>{const s=__game.scene.getScene('Interior');s.scene.start('Interior',{id:'${B}'});return 1})()`)}`, 'wait:2500',
  `eval:${enc(duel(B))}`, 'wait:1000', `eval:${enc(playOut(false))}`, 'wait:700', 'shot:08-house-lost', 'key:Escape', 'wait:800',
  // 7. the League mid-way
  `eval:${enc("(__game.scene.getScene('UI').league(),1)")}`, 'wait:1200', `eval:${enc(right)}`, 'wait:200', `eval:${enc(next)}`, 'wait:200', `eval:${enc(wrong)}`, 'wait:200', `eval:${enc(next)}`, 'wait:200', `eval:${enc(right)}`, 'wait:200', `eval:${enc(next)}`, 'wait:600', 'shot:09-league-mid',
  `eval:${enc(wrong)}`, 'wait:500', 'shot:10-league-miss',
  `eval:${enc(next)}`, 'wait:200', `eval:${enc(playOut(false))}`, 'wait:600', 'shot:11-league-lost', 'key:Escape', 'wait:600',
  `eval:${enc("(__game.scene.getScene('UI').league(),1)")}`, 'wait:1000', `eval:${enc(playOut(true))}`, 'wait:600', 'shot:12-league-won',
  `eval:${enc("(()=>'passedLeague: '+__hb.state.passedLeague)()")}`, 'key:Escape', 'wait:1500', 'key:Space', 'wait:600',
  `eval:${enc("(()=>'after the League: ui busy '+__hb.probe().busy+', phase '+__hb.probe().phase)()")}`,
];
const r = spawnSync('node', [path.join(here, 'shoot.mjs'), path.join(here, '..', 'dist', 'index.html'), out, steps.join(',')], { stdio: 'inherit', env: { ...process.env, VP: process.env.VP || (PHONE ? '390x844x2' : '1440x800x1'), Q: PHONE ? '?lite&test&touch&arrived' : '?lite&test&arrived' } });
const o2 = process.env.OUT2;
if (o2) for (const f of readdirSync(out).filter((f) => f.endsWith('.png'))) copyFileSync(path.join(out, f), path.join(o2, `duel-${PHONE ? 'phone-' : ''}${f}`));
console.log(`Duel pictures are in ${out}${o2 ? ` (and ${o2}/duel-${PHONE ? 'phone-' : ''}*.png)` : ''}.`);
process.exit(r.status || 0);
