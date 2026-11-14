// The notebook IS the menu in the story (docs/STORY.md, "The notebook"): the one found on the quay,
// open. Desktop: a two-page spread; a phone: one page at a time. Its three sections are marked by
// ribbon tabs (1 Journey, 2 Map, 3 Clues); everything on the paper is in the character's hand,
// first person, short. Settings stay plain UI, behind a button in the corner.
//   Journey  the goal, the houses as entries (ticked and struck through when done, the current one
//            circled), the lighthouse, pencilled "?" for places seen off the way, and the latest
//            entry: the next step (the tracker is its short form). Right page: the pages restored.
//   Map      the town as an ink sketch, houses numbered by hand, the next one circled in red pencil;
//            the mind map as a second sketch.
//   Clues    what was learnt, written down when it was learnt (logic.js notesOf, from the state);
//            the mementos pasted in with a caption; keys and tools; opened locks; things found by
//            chance; the coins as a tally.
// openNotebook({ tab, settings, touch }) has the contract of quest/menu.js openMenu: it resolves
// with 'ending' (see the ending again) or undefined. With "story": false the plain menu stays.
import { h } from '../../lab/shell.js';
import { COURSE, PLACE, PLACES, DISTRICTS } from '../../data/content.js';
import { state } from '../../systems/state.js';
import { TOWN, HARBOUR } from '../../world/townMap.js';
import { LIFE } from '../config.js';
import { lifePlan } from '../active.js';
import { Q, isCorePlace } from '../quest/active.js';
import { Q_WORDS } from '../quest/strings.js';
import { knownAs } from '../quest/townmap.js';
import { openedLocks } from '../riddles/journal.js';
import { TOOLS } from '../obstacles/kinds.js';
import { floorsOf } from '../floors/plan.js';
import { SECRETS } from '../secrets/registry.js';
import { PAINTINGS, openPainting } from '../secrets/paintings.js';
import { S_WORDS } from './words.js';
import { tr, fill } from './config.js';
import { pageText, notesOf } from './logic.js';
import { isFoggy } from './fog.js';
import { theWord } from './lighthouse.js';
import { objectPainter } from './scenes/objects.js';
import { canvas, rnd } from './paint.js';

const N = S_WORDS.nb, TABS = ['journey', 'map', 'mysteries'];
// a hand that reads: upright handwriting faces where the system has one (no slant is invented for
// them: font-synthesis none), else an italic serif, which every system has and everyone can read
const HANDF = '"Segoe Print","Noteworthy","Bradley Hand","Comic Neue","Patrick Hand",Georgia,"DejaVu Serif",serif';
const INK = '#1f2a4d', PENCIL = '#66625b', RED = '#a93b2b';
const DCOL = ['#4b6fb8', '#b8574b', '#3f9188', '#c07a32'];
const RIB = { journey: '#8c2f2a', map: '#2f5b46', mysteries: '#2c3f6e' };

const CSS = `
.nbk{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 40%,#1a1712f2,#07080cf7);color:#e8eaf0;font:16px system-ui,sans-serif}
.nbk-bar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 12px;max-width:1300px;width:100%;margin:0 auto;box-sizing:border-box}
.nbk-ui{display:inline-flex;align-items:center;gap:8px;min-height:44px;min-width:44px;padding:0 16px;border-radius:10px;background:#1e2633;border:1px solid #3a4558;color:#f1f3f8;font:600 16px system-ui,sans-serif;cursor:pointer;justify-content:center}
.nbk-ui:hover,.nbk-ui:focus-visible{background:#2a3446;outline:2px solid #9fb6e0;outline-offset:1px}
.nbk-ui .x{font-size:20px;line-height:1}
.nbk-book{flex:1;min-height:0;display:flex;flex-direction:column;max-width:1300px;width:100%;margin:0 auto;padding:0 12px 12px;box-sizing:border-box}
.nbk-tabs{flex:none;display:flex;gap:6px;padding:0 26px;position:relative;z-index:2}
.nbk-tab{position:relative;min-height:46px;min-width:44px;padding:4px 18px 0;border:0;border-radius:10px 10px 0 0;background:var(--rib);color:#fdf8ea;font:600 20px/1.1 ${HANDF};font-style:italic;font-synthesis:none;cursor:pointer;box-shadow:inset 0 -6px 8px -6px #0006;opacity:.8;top:4px}
.nbk-tab .k{font:600 13px system-ui,sans-serif;font-style:normal;opacity:.75;margin-right:7px;vertical-align:2px}
.nbk-tab[aria-selected=true]{opacity:1;top:0;background:#efe5cb;color:${INK};box-shadow:0 -2px 6px #0004}
.nbk-tab[aria-selected=true]::after{content:'';position:absolute;left:12px;right:12px;bottom:-1px;height:4px;background:var(--rib);border-radius:2px}
.nbk-tab:focus-visible{outline:3px solid #9fb6e0;outline-offset:2px}
.nbk-cover{flex:1;min-height:0;display:flex;padding:10px;border-radius:12px;background:#3a2a1d;background-image:linear-gradient(135deg,#46331f,#2e2016);box-shadow:0 18px 50px #000c,inset 0 0 0 2px #5a4128}
.nbk-spread{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;border-radius:4px;overflow:hidden}
.nbk-pg{position:relative;min-height:0;overflow:auto;overscroll-behavior:contain;padding:22px 34px 30px 44px;background-color:#efe5cb;background-image:var(--tex),radial-gradient(ellipse at 30% 20%,#fff8e620,#b8a07a1c 80%),repeating-linear-gradient(transparent 0 33px,#9db1c955 33px 34px);background-position:0 0,0 0,0 12px;background-attachment:local,scroll,local;color:${INK};font:20px/34px ${HANDF};font-style:italic;font-synthesis:none}
.nbk-pg:focus{outline:none}
.nbk-pg.l{box-shadow:inset -28px 0 30px -24px #5a4a2e88;border-right:1px solid #c9b88f}
.nbk-pg.r{box-shadow:inset 28px 0 30px -24px #5a4a2e88}
.nbk-pg.l::before{content:'';position:absolute;top:0;bottom:0;left:28px;width:1px;background:#d9786a66}
.nbk-pg p,.nbk-pg ol,.nbk-pg ul,.nbk-pg figure{margin:0}
.nbk-pg h2{margin:0;font:600 26px/34px ${HANDF};font-style:italic;font-synthesis:none;color:${INK};text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:6px}
.nbk-pg h2+*{margin-top:4px}
.nbk-pg .sig{float:right;font-size:19px;color:${PENCIL};transform:rotate(-3deg)}
.nbk-pg .pencil{color:${PENCIL}}
.nbk-pg .small{font-size:18px}
.nbk-pg .sp{height:34px}
.nbk-ent{list-style:none;padding:0}
.nbk-ent li{display:flex;align-items:baseline;gap:10px;min-height:34px}
.nbk-ent .n{flex:none;display:inline-grid;place-items:center;width:30px;height:30px;font-weight:600}
.nbk-ent .n.circ{border:2px solid ${RED};border-radius:52% 46% 55% 44%/48% 55% 45% 52%;transform:rotate(-8deg);color:${RED}}
.nbk-ent .t{flex:1;min-width:0}
.nbk-ent .done .nm{text-decoration:line-through;text-decoration-thickness:2px;text-decoration-color:#1f2a4dbb}
.nbk-ent .cur .nm{text-decoration:underline wavy ${RED};text-decoration-thickness:1.5px;text-underline-offset:6px}
.nbk-ent .st{color:${PENCIL};font-size:18px}
.nbk-ent .fog{color:#4e5d7c;font-size:18px}
.nbk-ent svg{flex:none;width:26px;height:26px;align-self:center}
.nbk-latest{margin-top:30px !important;font-size:23px;line-height:34px;color:#16204a}
.nbk-latest .ar{color:${RED};margin-right:8px;font-style:normal}
.nbk-latest .d{display:block;font:600 14px/20px system-ui,sans-serif;color:${PENCIL};letter-spacing:.08em;text-transform:uppercase}
.nbk-slip{position:relative;margin:12px 4px 14px;padding:8px 14px 10px;background:#f7f0de;box-shadow:0 2px 5px #5a4a2e55;line-height:30px;transform:rotate(var(--r))}
.nbk-slip::before,.nbk-slip::after{content:'';position:absolute;top:-8px;width:54px;height:18px;background:#e6d9aacc;box-shadow:0 1px 2px #0002}
.nbk-slip::before{left:14px;transform:rotate(-6deg)}.nbk-slip::after{right:14px;transform:rotate(5deg)}
.nbk-slip .from{display:block;font-size:17px;line-height:24px;color:${PENCIL}}
.nbk-stub{position:relative;min-height:34px;color:${PENCIL};font-size:18px;padding-left:20px}
.nbk-stub::before{content:'';position:absolute;left:0;top:4px;bottom:6px;width:12px;background:#ddcfa9;clip-path:polygon(0 0,100% 10%,60% 25%,100% 40%,55% 55%,100% 70%,60% 85%,100% 100%,0 100%)}
.nbk-btn{margin-top:14px;min-height:46px;padding:0 20px;border-radius:10px;border:2px solid ${INK};background:#f7f0de;color:${INK};font:600 19px ${HANDF};font-style:italic;font-synthesis:none;cursor:pointer}
.nbk-btn:hover,.nbk-btn:focus-visible{background:#fffaf0;outline:2px solid ${RED};outline-offset:2px}
.nbk-turn{display:none}
.nbk-map{position:relative;margin:6px auto 0}
.nbk-map canvas{display:block}
.nbk-mk{position:absolute;transform:translate(-50%,-50%);min-width:30px;height:30px;padding:0 4px;border:0;background:none;color:${INK};font:700 21px/30px ${HANDF};font-style:italic;font-synthesis:none;cursor:pointer;text-shadow:0 0 3px #efe5cb,0 0 3px #efe5cb}
.nbk-mk::before{content:'';position:absolute;inset:-8px}
.nbk-mk.mystery{color:${PENCIL};font-weight:400}
.nbk-mk.core{color:#4e5876}
.nbk-mk.next{border:2px solid ${RED};border-radius:52% 46% 55% 44%/48% 55% 45% 52%;color:${RED}}
.nbk-mk.on{outline:2px dashed ${RED};outline-offset:3px}
.nbk-mk:focus-visible{outline:2px solid ${RED}}
.nbk-lab{position:absolute;transform:translate(-50%,-50%);font-size:17px;line-height:18px;color:${PENCIL};white-space:nowrap;pointer-events:none;text-shadow:0 0 3px #efe5cb,0 0 3px #efe5cb}
.nbk-me{position:absolute;transform:translate(-30%,-50%);color:${RED};font:700 22px/1 ${HANDF};font-style:italic;font-synthesis:none;pointer-events:none;white-space:nowrap;text-shadow:0 0 3px #efe5cb}
.nbk-me i{font-size:17px;font-weight:400;margin-left:3px}
.nbk-cap{min-height:68px;margin-top:8px !important}
.nbk-mind .root{display:block;width:fit-content;max-width:88%;margin:8px auto 16px;padding:10px 24px;border:2px solid ${INK};border-radius:48% 52% 46% 54%/55% 45% 55% 45%;text-align:center;line-height:30px}
.nbk-mind .br{margin:0 0 12px 6px;padding-left:16px;border-left:2px solid #1f2a4d88;border-bottom-left-radius:14px}
.nbk-mind .dn{font-weight:600;text-decoration:underline;text-underline-offset:5px}
.nbk-mind .di{font-size:18px;line-height:26px;color:${PENCIL}}
.nbk-mind ul{padding:0}
.nbk-mind li{list-style:none;line-height:30px}
.nbk-mind li .nm{font-weight:600}
.nbk-mind li.no{color:#4e5876}
.nbk-mind li.q{color:${PENCIL}}
.nbk-mind li .i{font-size:18px}
.nbk-mind li.next .nm{text-decoration:underline wavy ${RED};text-underline-offset:5px}
.nbk-log{padding:0;list-style:none}
.nbk-log li{position:relative;padding-left:24px;line-height:34px}
.nbk-log li::before{content:'–';position:absolute;left:4px;color:${PENCIL}}
.nbk-log li.new{color:#16204a}
.nbk-things{display:flex;flex-wrap:wrap;gap:18px 22px;margin:14px 0 16px}
.nbk-thing{width:168px;transform:rotate(var(--r))}
.nbk-thing img{display:block;width:168px;height:112px;object-fit:cover;border:6px solid #fbf6e8;box-shadow:0 3px 6px #5a4a2e66;filter:sepia(.25) saturate(.85)}
.nbk-thing figcaption{font-size:18px;line-height:22px;margin-top:6px}
.nbk-pk{padding:0;list-style:none}
.nbk-pk li{line-height:34px}
.nbk-pk button{min-height:44px;margin-left:8px;padding:0 10px;border:0;background:none;color:${RED};font:inherit;text-decoration:underline;cursor:pointer}
.nbk-tally{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.nbk-tally svg{height:32px}
.nbk-set{position:absolute;top:58px;left:12px;z-index:5;width:min(440px,calc(100vw - 24px));max-height:calc(100vh - 80px);overflow:auto;padding:12px;border-radius:12px;background:#141922;border:1px solid #3a4558;box-shadow:0 12px 30px #000a;display:flex;flex-wrap:wrap;gap:8px;box-sizing:border-box}
.nbk-set[hidden]{display:none}
.nbk-tog{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:10px;background:none;border:1px solid #3a4558;color:#f1f3f8;cursor:pointer;font-size:16px}
.nbk-tog .v{color:#9aa3b7}.nbk-tog[aria-pressed=true] .v{color:#7fe0d4;font-weight:600}
.nbk-keys{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;width:100%;margin:6px 0 2px;font-size:16px;color:#aab2c4}
.nbk-keys kbd{font:inherit;color:#f1f3f8;white-space:nowrap}
@media (max-width:760px){
  .nbk-bar{padding:4px 8px}
  .nbk-book{padding:0 6px 6px}
  .nbk-tabs{padding:0 6px;gap:4px}
  .nbk-tab{flex:1;padding:4px 6px 0;font-size:19px}
  .nbk-tab .k{display:none}
  .nbk-cover{padding:5px}
  .nbk-spread{grid-template-columns:1fr}
  .nbk-spread[data-p="0"] .r,.nbk-spread[data-p="1"] .l{display:none}
  .nbk-pg{padding:16px 16px 24px 30px}
  .nbk-pg.l,.nbk-pg.r{box-shadow:none;border:0}
  .nbk-pg.l::before,.nbk-pg.r::before{content:'';position:absolute;top:0;bottom:0;left:18px;width:1px;background:#d9786a66}
  .nbk-turn{display:flex;justify-content:flex-end;margin-top:20px}
  .nbk-pg.r .nbk-turn{justify-content:flex-start}
  .nbk-thing,.nbk-thing img{width:140px}.nbk-thing img{height:94px}
}
`;
let styled = false, TEX = '';

// the paper's grain, painted once per session: fibres on a tile (no stains: a tile repeats them)
function texture() {
  if (TEX) return TEX;
  const [c, g] = canvas(256, 256), r = rnd(11);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,100,60' : '255,250,235'},${0.03 + r() * 0.05})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(110,90,55,${0.05 + r() * 0.06})`; g.lineWidth = 0.6; const x = r() * 256, y = r() * 256, a = r() * 6.28, l = 4 + r() * 12; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  TEX = `url(${c.toDataURL('image/png')})`;
  return TEX;
}

const TICK = '<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M4 14 C7 15.5 9 18.5 10.5 21.5 C13 14 17 8 23 4" fill="none" stroke="#2b5a3a" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svg = (html) => h('span', { html }).firstChild;
const nameOf = () => state.story?.name || tr(S_WORDS.defaultName);

// the latest entry: the next step, as the character would write it
function latest(st) {
  if (state.ended) {
    const fog = Q.coreProgress(state).find((r) => isFoggy(r.id));
    return fog ? fill(tr(N.next.fog), { order: fog.order }) : tr(S_WORDS.endedLine);
  }
  const T = N.next, k = T[st.kind] ? st.kind : 'visit';
  return fill(tr(T[k]), { order: st.order, place: st.place?.name, person: st.person, n: st.n, m: st.m });
}

// ---- Journey: the way, and the pages
function journey(onEnding, turn) {
  const st = Q.nextStep(state), rows = Q.coreProgress(state), cur = st.place?.id;
  const L = [h('span', { class: 'sig' }, nameOf()), h('h2', {}, state.ended ? tr(N.anotherRound) : tr(N.sections.journey))];
  if (!state.ended) for (const l of tr(S_WORDS.goal)) L.push(h('p', { class: 'small' }, l));
  L.push(h('div', { class: 'sp' }));
  const li = rows.map((r) => {
    const fog = state.ended && isFoggy(r.id), now = r.id === cur && !state.ended;
    const note = fog ? null : r.done ? tr(N.remembers) : r.won && r.memento && !r.found ? tr(N.upstairs) : r.visited && r.n < r.m ? fill(tr(N.machines), { n: r.n, m: r.m }) : '';
    return h('li', { class: `${r.done && !fog ? 'done' : ''}${now ? ' cur' : ''}` },
      h('span', { class: `n${now ? ' circ' : ''}` }, String(r.order)),
      h('span', { class: 't' }, h('span', { class: 'nm' }, PLACE[r.id].name), note ? h('span', { class: 'st' }, ` · ${note}`) : null, fog ? h('span', { class: 'fog' }, ` · ${tr(N.fog)}`) : null),
      r.done && !fog ? svg(TICK) : null);
  });
  const lit = state.ended || state.passedLeague, lcur = !state.ended && (st.kind === 'league' || st.kind === 'ending');
  li.push(h('li', { class: `${lit ? 'done' : ''}${lcur ? ' cur' : ''}` }, h('span', { class: `n${lcur ? ' circ' : ''}` }, '✦'),
    h('span', { class: 't' }, h('span', { class: 'nm' }, tr(N.lighthouse)), h('span', { class: 'st' }, ` ${lit ? tr(N.lit) : tr(N.locked)}`)), lit ? svg(TICK) : null));
  L.push(h('ol', { class: 'nbk-ent' }, li));
  // places seen off the way, pencilled, never as tasks
  const off = PLACES.filter((p) => !isCorePlace(p.id) && state.visited?.[p.id]).slice(0, 3);
  for (const p of off) L.push(h('p', { class: 'pencil small' }, fill(tr(N.maybe), { place: p.name })));
  L.push(h('p', { class: 'nbk-latest', 'data-latest': '1' }, h('span', { class: 'd' }, tr(N.now)), h('span', { class: 'ar', 'aria-hidden': 'true' }, '→'), latest(st)));
  L.push(turn(1));
  // the pages
  const R = [h('h2', {}, state.ended ? tr(N.pagesAfter) : tr(N.pages))];
  rows.forEach((r, i) => {
    if (state.story?.mementos?.[r.id] || (!r.memento && r.done)) R.push(h('div', { class: 'nbk-slip', style: `--r:${(i % 2 ? 0.8 : -0.7) * (1 + (i % 3) * 0.3)}deg` }, h('span', { class: 'from' }, fill(tr(N.pageOf), { order: r.order })), pageText(PLACE[r.id])));
    else R.push(h('div', { class: 'nbk-stub' }, `${fill(tr(N.pageOf), { order: r.order })} · ${tr(N.torn)}`));
  });
  if (Q.leagueOpen(state) || state.ended) R.push(h('div', { class: 'sp' }), h('p', {}, COURSE.bigIdea), h('p', {}, fill(tr(S_WORDS.lastLine), { word: theWord() })));
  if (state.ended && onEnding) R.push(h('button', { type: 'button', class: 'nbk-btn', onclick: onEnding }, tr(N.again)));
  R.push(turn(0));
  return [L, R];
}

// ---- Map: the town as an ink sketch; the mind map as another sketch
function townSketch(maxW, maxH) {
  const { TERRAIN, BUILDINGS, HUB } = TOWN;
  let x0 = TOWN.W, y0 = TOWN.H, x1 = 0, y1 = 0;
  const grow = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  TERRAIN.forEach((row, y) => { for (let x = 0; x < row.length; x++) if ('pcw~G'.includes(row[x])) grow(x, y); });
  BUILDINGS.forEach((b) => { grow(b.x, b.y); grow(b.x + b.w - 1, b.y + b.h - 1); });
  x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(TOWN.W - 1, x1 + 2); y1 = Math.min(TOWN.H - 1, y1 + 2);
  const W = x1 - x0 + 1, H = y1 - y0 + 1, s = Math.max(3, Math.min(14, maxW / W, maxH / H)), d = Math.min(2, window.devicePixelRatio || 1);
  const [cv, g] = canvas(W * s * d, H * s * d);
  cv.style.width = `${W * s}px`; cv.style.height = `${H * s}px`;
  g.scale(d, d);
  const T = (x, y) => TERRAIN[y + y0]?.[x + x0] || 'g', r = rnd(7);
  const j = () => (r() - 0.5) * s * 0.12;
  const line = (ax, ay, bx, by) => { g.beginPath(); g.moveTo(ax + j(), ay + j()); g.lineTo(bx + j(), by + j()); g.stroke(); };
  const ground = (c) => 'pcwsdG'.includes(c);
  // water: a wash and a few waves; the lanes: a pencil wash; trees: a loop here and there
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = T(x, y);
    if (c === '~') { g.fillStyle = 'rgba(70,100,150,.13)'; g.fillRect(x * s, y * s, s, s); if ((x + y * 3) % 5 === 0) { g.strokeStyle = 'rgba(60,90,140,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x * s, y * s + s / 2); g.quadraticCurveTo(x * s + s / 2, y * s + s * 0.2, x * s + s, y * s + s / 2); g.stroke(); } }
    else if (ground(c)) { g.fillStyle = c === 'w' ? 'rgba(120,90,50,.16)' : 'rgba(120,105,80,.09)'; g.fillRect(x * s, y * s, s, s); }
    else if (c === 'T' && r() < 0.16) { g.strokeStyle = 'rgba(60,80,60,.22)'; g.lineWidth = 1; g.beginPath(); g.arc(x * s + s / 2, y * s + s / 2, s * 0.32, 0, 6.28); g.stroke(); }
  }
  // the lanes' edges, in ink
  g.strokeStyle = 'rgba(31,42,77,.55)'; g.lineWidth = 1.1; g.lineCap = 'round';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!ground(T(x, y))) continue;
    const X = x * s, Y = y * s;
    if (!ground(T(x, y - 1))) line(X, Y, X + s, Y);
    if (!ground(T(x, y + 1))) line(X, Y + s, X + s, Y + s);
    if (!ground(T(x - 1, y))) line(X, Y, X, Y + s);
    if (!ground(T(x + 1, y))) line(X + s, Y, X + s, Y + s);
  }
  // the ship at its berth: a hull and two funnels, sketched
  const sh = HARBOUR?.ship;
  if (sh) {
    const cx = (sh.cx - x0) * s, by = (sh.bottom - y0) * s, hw = 5 * s, hh = 2.2 * s;
    g.strokeStyle = 'rgba(31,42,77,.85)'; g.lineWidth = 1.4; g.fillStyle = 'rgba(239,229,203,.9)';
    g.beginPath(); g.moveTo(cx - hw, by - hh); g.lineTo(cx + hw * 1.08, by - hh); g.lineTo(cx + hw * 0.86, by); g.lineTo(cx - hw * 0.92, by); g.closePath(); g.fill(); g.stroke();
    for (const fx of [-0.25, 0.2]) g.strokeRect(cx + fx * hw, by - hh - 1.6 * s, 0.8 * s, 1.6 * s);
  }
  const marks = [], labels = [];
  const nextId = state.ended ? null : (() => { const st = Q.nextStep({ ...state, seenIntro: true }); return st.place?.id || (st.kind === 'league' ? 'league' : null); })();
  for (const b of BUILDINGS) {
    const k = knownAs(b);
    if (k === 'hidden') continue;
    const p = PLACE[b.id], di = p ? DISTRICTS.indexOf(p.district) : 0, X = (b.x - x0) * s, Y = (b.y - y0) * s, w = b.w * s, hh = b.h * s;
    if (k === 'league') {
      // the lighthouse: a tower, unlabelled; rays once lit
      const cx = X + w / 2, top = Y - s * 0.6;
      g.strokeStyle = INK; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx - s * 0.9, Y + hh); g.lineTo(cx - s * 0.55, top + s); g.lineTo(cx + s * 0.55, top + s); g.lineTo(cx + s * 0.9, Y + hh); g.stroke();
      g.strokeRect(cx - s * 0.6, top, s * 1.2, s);
      if (state.ended || state.passedLeague) { g.strokeStyle = 'rgba(200,150,40,.85)'; for (const a of [-1.1, -0.5, 0.5, 1.1]) line(cx, top + s / 2, cx + Math.sin(a) * s * 2.6, top + s / 2 - Math.cos(a) * s * 1.6); }
      const m = h('button', { type: 'button', class: `nbk-mk${nextId === 'league' ? ' next' : ''}`, style: `left:${cx}px;top:${top + s / 2}px;color:transparent;text-shadow:none`, 'aria-label': tr(N.tower), 'data-text': tr(N.tower) }, '·');
      marks.push(m); continue;
    }
    if (k === 'visited') { g.fillStyle = `${DCOL[di % DCOL.length]}38`; g.fillRect(X, Y, w, hh); }
    g.strokeStyle = k === 'mystery' ? 'rgba(100,98,92,.7)' : INK; g.lineWidth = k === 'home' ? 0.9 : 1.3;
    if (k === 'mystery') g.setLineDash([3, 3]);
    for (let pass = 0; pass < (k === 'visited' ? 2 : 1); pass++) { line(X, Y, X + w, Y); line(X + w, Y, X + w, Y + hh); line(X + w, Y + hh, X, Y + hh); line(X, Y + hh, X, Y); }
    g.setLineDash([]);
    if (k === 'home') continue;
    const text = k === 'visited' ? `${b.order}. ${p.name}: ${p.idea}` : k === 'core' ? fill(tr(N.notYet), { order: b.order, place: p.name }) : tr(N.unknown);
    marks.push(h('button', { type: 'button', class: `nbk-mk ${k}${b.id === nextId ? ' next' : ''}`, style: `left:${X + w / 2}px;top:${Y + hh / 2}px`, 'aria-label': text, 'data-text': text }, k === 'mystery' ? '?' : String(b.order)));
  }
  if (sh) labels.push(h('span', { class: 'nbk-lab', style: `left:${(sh.cx - x0) * s}px;top:${(sh.bottom - y0) * s + 12}px` }, tr(N.ship)));
  labels.push(h('span', { class: 'nbk-lab', style: `left:${(HUB.x - x0 + 0.5) * s}px;top:${(HUB.y - y0 + 4.6) * s}px` }, tr(N.square)));
  const pos = state.pos || TOWN.START;
  labels.push(h('span', { class: 'nbk-me', style: `left:${(pos.x - x0 + 0.5) * s}px;top:${(pos.y - y0 + 0.5) * s}px` }, '×', h('i', {}, tr(N.me))));
  const cap = h('p', { class: 'nbk-cap', role: 'status' }, tr(N.tapHouse));
  for (const m of marks) m.onclick = () => { for (const o of marks) o.classList.remove('on'); m.classList.add('on'); cap.textContent = m.dataset.text; };
  return [h('div', { class: 'nbk-map', style: `width:${W * s}px;height:${H * s}px` }, cv, ...labels, ...marks), cap];
}

function mindSketch() {
  const st = Q.nextStep({ ...state, seenIntro: true }), next = state.ended ? null : st.place?.id;
  return h('div', { class: 'nbk-mind' }, h('span', { class: 'root' }, COURSE.bigIdea),
    DISTRICTS.map((d) => {
      const leaves = PLACES.filter((p) => p.district === d).map((p) => {
        const core = isCorePlace(p.id), been = !!state.visited?.[p.id];
        if (!core && !been) return state.seen?.[p.id] ? h('li', { class: 'q' }, '?') : null; // off the way: a pencilled "?" once seen
        return h('li', { class: `${been ? '' : 'no'}${p.id === next ? ' next' : ''}` }, h('span', { class: 'nm' }, `${p.order} ${p.name}`), been ? h('span', { class: 'i' }, `: ${p.idea}`) : null);
      }).filter(Boolean);
      return h('div', { class: 'br' }, h('div', { class: 'dn' }, d.name), d.idea ? h('div', { class: 'di' }, d.idea) : null, h('ul', {}, leaves));
    }));
}

// ---- Clues: the log, the things pasted in, the pockets, the coins
const THUMBS = new Map();
function thumb(kind) {
  const name = nameOf(), key = `${kind}|${name}`;
  if (!THUMBS.has(key)) {
    // painted as the close-up is, then cropped to the object at the middle of the table
    const [c, g] = canvas(720, 480), [t, tg] = canvas(360, 240);
    try { objectPainter(kind).base(g, 720, 480, { name, arrived: state.story?.arrivedAt, house: { wide: true } }); tg.drawImage(c, 150, 100, 420, 280, 0, 0, 360, 240); } catch { /* a thumbnail is a nicety */ }
    THUMBS.set(key, t.toDataURL('image/jpeg', 0.85));
  }
  return THUMBS.get(key);
}

function tally(n) {
  const marks = Math.min(25, Math.ceil(n / 10)), parts = [];
  for (let i = 0; i < marks; i++) {
    const grp = Math.floor(i / 5), k = i % 5, x = grp * 40 + k * 7 + 4;
    parts.push(k === 4 ? `<path d="M${grp * 40} 26 L${grp * 40 + 32} 6"/>` : `<path d="M${x} 4 L${x + 1} 28"/>`);
  }
  const w = Math.max(10, Math.ceil(marks / 5) * 40);
  return svg(`<svg viewBox="0 0 ${w} 32" width="${w}" aria-hidden="true" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round">${parts.join('')}</svg>`);
}

function clues(busy, turn) {
  const rows = Q.coreProgress(state), notes = notesOf(state, rows), C = N.clue;
  const text = (e) => {
    const p = e.id ? PLACE[e.id] : null, person = p?.host?.name || p?.expert?.name || p?.name || '';
    if (e.k === 'master') return fill(tr(C.master), { order: e.order, place: p?.name });
    if (e.k === 'remembered') return e.next ? fill(tr(C.remembered), { person, next: e.next }) : fill(tr(C.rememberedLast), { person });
    if (e.k === 'memento') return fill(tr(C.memento), { thought: fill(tr((S_WORDS.mementos[e.kind] || S_WORDS.mementos.page).thought), { name: nameOf() }), order: e.order });
    if (e.k === 'word') return fill(tr(C.word), { word: theWord() });
    return tr(C[e.k]);
  };
  const L = [h('h2', {}, tr(N.log))];
  L.push(notes.length ? h('ol', { class: 'nbk-log' }, notes.map((e, i) => h('li', { class: i === notes.length - 1 ? 'new' : '' }, text(e)))) : h('p', { class: 'pencil' }, tr(N.nothing)));
  L.push(turn(1));
  const R = [h('h2', {}, tr(N.things))];
  const found = Object.entries(state.story?.mementos || {}), M = (kind) => S_WORDS.mementos[kind] || S_WORDS.mementos.page;
  if (!found.length) R.push(h('p', { class: 'pencil' }, tr(S_WORDS.mementoNone)));
  else R.push(h('div', { class: 'nbk-things' }, found.map(([id, kind], i) => h('figure', { class: 'nbk-thing', style: `--r:${i % 2 ? 1.2 : -1.4}deg` },
    h('img', { src: thumb(kind), alt: tr(M(kind).title) }), h('figcaption', {}, `${tr(M(kind).title)}, ${fill(tr(N.pageOf), { order: PLACE[id]?.order ?? '' })}`)))));
  // the pockets: keys where there is an upstairs, tools
  const pk = [];
  for (const [id, has] of Object.entries(state.keys || {})) if (has && PLACE[id] && floorsOf(PLACE[id]).up) pk.push(h('li', {}, fill(tr(N.key), { place: PLACE[id].name })));
  for (const [t, has] of Object.entries(state.tools || {})) if (has && TOOLS[t]) pk.push(h('li', {}, tr(TOOLS[t])));
  if (pk.length) R.push(h('div', { class: 'sp' }), h('h2', {}, tr(N.carry)), h('ul', { class: 'nbk-pk' }, pk));
  // opened locks, and things found by chance: only what was found is written (extras are never tasks)
  const locks = openedLocks();
  if (locks.length) R.push(h('div', { class: 'sp' }), h('h2', {}, tr(N.locks)), h('ul', { class: 'nbk-pk' }, locks.map((e) => h('li', {}, `${tr(e.title)} · ${e.house}`, e.note ? h('div', { class: 'pencil small' }, `"${e.note}"`) : null))));
  if (LIFE.secrets) {
    const got = state.life?.found || {}, list = lifePlan().secrets.filter((s) => got[s.id] && SECRETS[s.kind]);
    const look = async (id) => { busy(true); await openPainting(id, TOWN); busy(false); };
    if (list.length) R.push(h('div', { class: 'sp' }), h('h2', {}, tr(N.found)), h('ul', { class: 'nbk-pk' }, list.map((s) => h('li', {}, s.kind === 'painting' && PAINTINGS[s.painting] ? tr(PAINTINGS[s.painting].title) : s.kind === 'note' ? `"${s.text}"` : tr(SECRETS[s.kind].title),
      s.kind === 'painting' || s.kind === 'prints' ? h('button', { type: 'button', onclick: () => look(s.kind === 'prints' ? 'lanterncat' : s.painting) }, tr(N.look)) : null))));
  }
  const n = state.insight || 0;
  R.push(h('div', { class: 'sp' }), h('div', { class: 'nbk-tally' }, n ? tally(n) : null, h('span', {}, fill(tr(N.coins), { n }))));
  R.push(turn(0));
  return [L, R];
}

export function openNotebook({ tab = null, settings = [], touch = false } = {}) {
  if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; }
  let cur = tab || 'journey', busy = false, result, finish = () => {};
  const root = h('div', { class: 'nbk', role: 'dialog', 'aria-label': tr(N.title) });
  root.style.setProperty('--tex', texture());
  // the corner: settings (plain), close (plain, obvious)
  const close = h('button', { type: 'button', class: 'nbk-ui', 'aria-label': tr(N.close) }, h('span', {}, tr(N.close)), h('span', { class: 'x', 'aria-hidden': 'true' }, '✕'));
  const setBtn = h('button', { type: 'button', class: 'nbk-ui', 'aria-expanded': 'false' }, h('span', { 'aria-hidden': 'true' }, '⚙'), h('span', {}, tr(N.settings)));
  const panel = h('div', { class: 'nbk-set', hidden: '' });
  const togs = settings.map((s) => {
    const b = h('button', { type: 'button', class: 'nbk-tog' });
    const draw = () => { b.setAttribute('aria-pressed', String(s.on())); b.replaceChildren(h('span', {}, s.label), h('span', { class: 'v' }, s.value())); };
    b.onclick = () => { s.toggle(); draw(); };
    draw();
    return b;
  });
  panel.append(...togs, h('div', { class: 'nbk-keys' }, (touch ? tr(Q_WORDS.touchHelp) : tr(Q_WORDS.keysHelp)).flatMap(([k, v]) => [h('kbd', {}, k), h('span', {}, v)])));
  const setOpen = (o) => { panel.hidden = !o; setBtn.setAttribute('aria-expanded', String(o)); };
  setBtn.onclick = () => setOpen(panel.hidden);
  // the ribbons
  const tabs = h('div', { class: 'nbk-tabs', role: 'tablist', 'aria-label': tr(N.title) });
  const btns = TABS.map((t, i) => h('button', { type: 'button', class: 'nbk-tab', role: 'tab', style: `--rib:${RIB[t]}`, onclick: () => show(t) }, h('span', { class: 'k' }, String(i + 1)), tr(N.sections[t])));
  tabs.append(...btns);
  const spread = h('div', { class: 'nbk-spread', 'data-p': '0' });
  const left = h('section', { class: 'nbk-pg l', tabindex: '-1' }), right = h('section', { class: 'nbk-pg r', tabindex: '-1' });
  spread.append(left, right);
  const cover = h('div', { class: 'nbk-cover' }, spread);
  root.append(h('div', { class: 'nbk-bar' }, setBtn, close), panel, h('div', { class: 'nbk-book' }, tabs, cover));
  document.body.append(root);
  // on a phone, one page at a time: a hand-written "next page" at the foot of each
  const turn = (to) => h('div', { class: 'nbk-turn' }, h('button', { type: 'button', class: 'nbk-btn', onclick: () => page(to) }, to ? `${tr(N.nextPage)} →` : `← ${tr(N.prevPage)}`));
  const page = (p) => { spread.dataset.p = String(p); (p ? right : left).scrollTop = 0; root.dataset.page = String(p); };
  const done = (v) => { result = v; finish(); };
  function show(t) {
    cur = t;
    btns.forEach((b, i) => b.setAttribute('aria-selected', String(TABS[i] === t)));
    const phone = window.innerWidth <= 760, pw = phone ? window.innerWidth - 64 : Math.min(window.innerWidth - 48, 1276) / 2 - 100;
    const size = { w: Math.max(200, pw), h: Math.max(220, window.innerHeight - (phone ? 300 : 290)) };
    const [L, R] = t === 'journey' ? journey(() => done('ending'), turn)
      : t === 'map' ? [[h('h2', {}, tr(N.town)), ...townSketch(size.w, size.h), turn(1)], [h('h2', {}, tr(N.mind)), mindSketch(), turn(0)]]
        : clues((v) => { busy = v; }, turn);
    left.replaceChildren(...L.filter(Boolean)); right.replaceChildren(...R.filter(Boolean));
    page(0);
    root.dataset.tab = t;
  }
  show(cur);
  left.focus();
  root.dataset.ready = '1';
  return new Promise((resolve) => {
    finish = () => { window.removeEventListener('keydown', key, true); root.remove(); resolve(result); };
    const key = (e) => {
      if (busy) return;
      if (!panel.hidden && e.key === 'Escape') { e.preventDefault(); setOpen(false); setBtn.focus(); return; }
      const i = TABS.indexOf(cur);
      if (e.key === 'Escape' || e.key === 'Tab' || ((e.key === 'j' || e.key === 'J') && cur === 'mysteries')) { e.preventDefault(); finish(); }
      else if (e.key >= '1' && e.key <= '3') { e.preventDefault(); show(TABS[+e.key - 1]); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(TABS[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3]); }
    };
    window.addEventListener('keydown', key, true);
    close.onclick = () => finish();
  });
}
