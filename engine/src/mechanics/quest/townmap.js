// The Map tab: the town as explored so far, drawn from the generated town data (lanes, water,
// plazas, footprints) at a few pixels per tile. Houses visited: number and name; core houses not
// visited yet: number only; extras: "?" once the player has walked near them (state.seen), nothing
// before. Tapping a visited house recalls its one-line idea. Drawn once when the tab opens.
import { h } from '../../lab/shell.js';
import { TOWN } from '../../world/townMap.js';
import { PLACE, DISTRICTS, COURSE } from '../../data/content.js';
import { state } from '../../systems/state.js';
import { touch } from '../../systems/view.js';
import { isCorePlace, Q } from './active.js';
import { Q_WORDS, tr } from './strings.js';

const GROUND = { g: '#2c5233', f: '#33603a', G: '#3e6b34', T: '#1b3a22', b: '#24492b', c: '#8f877a', p: '#9c855c', w: '#7a5a3a', '~': '#28547f', s: '#c2ad78', d: '#b39a66', r: '#4a6440', R: '#5a4838', e: '#465a38', F: '#5f4a32' };
const DCOL = ['#6f93e0', '#ef7a6d', '#4fd1c5', '#f0a45a'];

export const SEEN_RADIUS = 5; // tiles: a place is "seen" when the player walks this close to its walls

// Marks the houses near (x, y) as seen; returns true when something changed. Cheap: one pass over
// the buildings (a dozen or two), on arrival at a tile, never per frame.
export function markSeen(x, y, s = state, town = TOWN) {
  let changed = false;
  s.seen ||= {};
  for (const b of town.BUILDINGS) {
    if (b.home || b.league || s.seen[b.id]) continue;
    const dx = Math.max(b.x - x, 0, x - (b.x + b.w - 1)), dy = Math.max(b.y - y, 0, y - (b.y + b.h - 1));
    if (Math.max(dx, dy) <= SEEN_RADIUS) { s.seen[b.id] = true; changed = true; }
  }
  return changed;
}

// What the map shows of a building: 'visited' | 'core' | 'mystery' | 'hidden' | 'league' | 'home'
export function knownAs(b, s = state) {
  if (b.league) return 'league';
  if (b.home) return 'home';
  if (s.visited?.[b.id]) return 'visited';
  if (isCorePlace(b.id)) return 'core';
  return s.seen?.[b.id] ? 'mystery' : 'hidden';
}

export function townMapView() {
  const { TERRAIN, BUILDINGS, HUB } = TOWN;
  // the window drawn: lanes, water, plazas and houses, with a margin; not the forest that rings the town
  let x0 = TOWN.W, y0 = TOWN.H, x1 = 0, y1 = 0;
  const grow = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  TERRAIN.forEach((row, y) => { for (let x = 0; x < row.length; x++) if ('pcw~G'.includes(row[x])) grow(x, y); });
  BUILDINGS.forEach((b) => { grow(b.x, b.y); grow(b.x + b.w - 1, b.y + b.h - 1); });
  x0 = Math.max(0, x0 - 3); y0 = Math.max(0, y0 - 3); x1 = Math.min(TOWN.W - 1, x1 + 3); y1 = Math.min(TOWN.H - 1, y1 + 3);
  const W = x1 - x0 + 1, H = y1 - y0 + 1;
  const avW = Math.min(window.innerWidth - 32, 980), avH = Math.max(220, window.innerHeight - (touch.on ? 330 : 300));
  const s = Math.max(2, Math.min(12, Math.floor(Math.min(avW / W, avH / H))));
  const cv = h('canvas', { class: 'qt-cv', width: W * s, height: H * s, 'aria-hidden': 'true' });
  const ctx = cv.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { ctx.fillStyle = GROUND[TERRAIN[y + y0][x + x0]] || GROUND.g; ctx.fillRect(x * s, y * s, s, s); }
  const nextId = (() => { const st = Q.nextStep({ ...state, seenIntro: true }); return st.place?.id || (st.kind === 'league' || st.kind === 'ending' ? 'league' : null); })();
  const marks = [], byId = {}, caption = h('p', { class: 'qt-cap', role: 'status' }, tr(touch.on ? Q_WORDS.map.tap : Q_WORDS.map.tapKeys));
  for (const b of BUILDINGS) {
    const k = knownAs(b);
    if (k === 'hidden') continue;
    const p = PLACE[b.id], di = p ? DISTRICTS.indexOf(p.district) : -1;
    const fill_ = k === 'visited' ? DCOL[di % DCOL.length] : k === 'core' ? '#d8d0b4' : k === 'league' ? '#c99a3e' : k === 'home' ? '#7d6a55' : '#5d6274';
    const bx = b.x - x0, by = b.y - y0;
    ctx.fillStyle = '#0b0d14'; ctx.fillRect(bx * s - 1, by * s - 1, b.w * s + 2, b.h * s + 2);
    ctx.fillStyle = fill_; ctx.fillRect(bx * s, by * s, b.w * s, b.h * s);
    ctx.fillStyle = '#00000040'; ctx.fillRect(bx * s, (by + b.h) * s - Math.max(1, s >> 1), b.w * s, Math.max(1, s >> 1));
    if (k === 'home') continue;
    const cx = (bx + b.w / 2) * s, cy = (by + b.h / 2) * s;
    const label = k === 'league' ? '★' : k === 'mystery' ? '?' : String(b.order);
    const text = k === 'visited' ? `${b.order} · ${p.name}: ${p.idea}` : k === 'core' ? `${b.order} · ${p.name}. ${tr(Q_WORDS.map.unknown)}` : k === 'league' ? `${COURSE.league.name}` : tr(Q_WORDS.map.mystery);
    const col = k === 'visited' ? `;border-color:${DCOL[di % DCOL.length]}` : '';
    const m = h('button', { type: 'button', class: `qt-mk ${k}${b.id === nextId ? ' next' : ''}`, style: `left:${cx}px;top:${cy}px${col}`, 'aria-label': text, title: text }, h('b', {}, label));
    m.onclick = () => { for (const o of marks) o.classList.remove('on'); m.classList.add('on'); caption.textContent = text; };
    marks.push(m); byId[b.id] = m;
  }
  const sq = h('span', { class: 'qt-sq', style: `left:${(HUB.x - x0 + 0.5) * s}px;top:${(HUB.y - y0 + 3.4) * s}px` }, tr(Q_WORDS.map.square));
  const pos = state.pos || TOWN.START;
  const me = h('span', { class: 'qt-me', style: `left:${(pos.x - x0 + 0.5) * s}px;top:${(pos.y - y0 + 0.5) * s}px`, title: tr(Q_WORDS.map.you) });
  const stage = h('div', { class: 'qt-stage', style: `width:${W * s}px;height:${H * s}px` }, cv, sq, ...marks, me);
  // visited houses as a short legend (names stay readable on a phone, where the map is small)
  const known = BUILDINGS.filter((b) => knownAs(b) === 'visited').sort((a, b) => a.order - b.order);
  const legend = known.length ? h('div', { class: 'qt-leg' }, known.map((b) => h('button', { type: 'button', onclick: () => byId[b.id]?.click() }, h('b', {}, String(b.order)), PLACE[b.id].name))) : null;
  return h('div', { class: 'qt' }, stage, caption, legend);
}

export const MAP_CSS = `
.qt{display:flex;flex-direction:column;align-items:center;gap:12px}
.qt-stage{position:relative;flex:none;border-radius:10px;overflow:hidden;box-shadow:0 0 0 1px var(--line),0 8px 24px #0008;max-width:100%}
.qt-cv{display:block;image-rendering:pixelated}
.qt-mk{position:absolute;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:6px;min-width:28px;height:28px;padding:0 7px;border-radius:14px;border:2px solid #0b0d14;background:#f4efe0;color:#131821;font-weight:700;font-size:16px;line-height:1;cursor:pointer;white-space:nowrap}
.qt-mk::before{content:'';position:absolute;inset:-9px}
.qt-mk b{min-width:12px;text-align:center}
.qt-mk .nm{font-weight:600;font-size:14px}
.qt-mk.core{background:#2a3142;color:#e8eaf0;border-color:#d8d0b4}
.qt-mk.mystery{background:#3a3f5a;color:#ffcf5a;border-color:#ffcf5a}
.qt-mk.league{background:#ffcf5a;color:#1c1a12}
.qt-mk.next{background:var(--gold);color:#1c1a12;border-color:#1c1a12;animation:qtnext 1s ease-in-out infinite alternate}
@keyframes qtnext{from{box-shadow:0 0 0 2px var(--gold)}to{box-shadow:0 0 0 6px #ffcf5a55}}
.qt-mk.on{outline:3px solid var(--acc);outline-offset:1px}
.qt-sq{position:absolute;transform:translate(-50%,-50%);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#f1ecd9;text-shadow:0 1px 2px #000,0 0 3px #000;pointer-events:none}
.qt-me{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px #0b0d14,0 0 0 4px var(--acc);animation:qtme 1.2s ease-in-out infinite alternate;pointer-events:none}
@keyframes qtme{from{transform:scale(1)}to{transform:scale(1.35)}}
.qt-cap{margin:0;min-height:48px;max-width:640px;text-align:center;color:var(--text);font-size:16px;line-height:1.45}
.qt-leg{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:720px}
.qt-leg button{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:22px;background:var(--card);border:1px solid var(--line);cursor:pointer;font-size:16px}
.qt-leg button b{color:var(--gold)}
`;
