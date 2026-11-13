// The mementos (docs/STORY.md): one per core house, upstairs, things of yours that should not be
// there, in an order that escalates (logic.js mementoOrder). Each is a first-person close-up drawn in
// code with the locks' painters (riddles/art.js: the dim room, the lamp, the dust), 160 x 120.
//   MEMENTOS[kind] = { paint(g, s, ctx) }   s: { t } animation; ctx: { name, house (a canvas), arrived (ms) }
//   mementoCanvas(kind, ctx) -> { el, stop }   a live canvas (and HTML on top where words must be read)
import { h } from '../../lab/shell.js';
import { rect, px, ellipse, mix, hash, makeCanvas } from '../../art/px.js';
import { drawText, textWidth } from '../../art/buildings.js';
import { AW, AH, closeRoom, closeVignette, closeDust, closeGlow, CLOSE_INK as INK } from '../riddles/art.js';
import { paintLighthouse } from './art.js';
import { reducedMotion } from './cinema.js';

const WOOD = '#4a3424';
// a table top seen from above, lit by the lamp at the upper left
function table(g) {
  closeRoom(g, '#2a2230', 18);
  for (let y = 18; y < AH; y++) for (let x = 0; x < AW; x++) {
    const plank = Math.floor((x + (y >> 4) * 13) / 26), lit = Math.max(0, 0.5 - Math.hypot(x - 18, y - 6) / 190);
    let c = mix(WOOD, '#5c4330', hash(plank, 3, 11) * 0.6);
    if ((x + (y >> 4) * 13) % 26 === 0) c = '#2e2018';
    if (hash(x >> 1, y, 7) > 0.97) c = mix(c, '#2e2018', 0.5);
    px(g, x, y, lit > 0.02 ? mix(c, '#ffd9a0', lit * 0.5) : c);
  }
}
const shadow = (g, x, y, w, hh) => { g.fillStyle = 'rgba(10,6,12,0.45)'; g.fillRect(x + 3, y + 4, w, hh); };
function sheet(g, x, y, w, hh, col = '#efe6cf', edge = '#c9bc9a') { shadow(g, x, y, w, hh); rect(g, x, y, w, hh, INK); rect(g, x + 1, y + 1, w - 2, hh - 2, col); rect(g, x + 1, y + hh - 2, w - 2, 1, edge); }
function scribble(g, x, y, w, lines, seed, col = '#4a3f6b', gap = 5) { // handwriting: little runs of ink, slanted
  for (let j = 0; j < lines; j++) { let cx = x; const end = x + w - Math.floor(hash(j, 1, seed) * w * 0.3); while (cx < end) { const L = 3 + Math.floor(hash(cx, j, seed) * 7); for (let k = 0; k < L && cx + k < end; k++) px(g, cx + k, y + j * gap + ((k + j) % 3 === 0 ? -1 : 0), col); cx += L + 2; } }
}

const hourOf = (ms) => { const d = new Date(ms || Date.now()); return [d.getHours() % 12, d.getMinutes()]; };
const dateOf = (ms, year) => { const d = new Date(ms || Date.now()); return `${d.getDate()}.${d.getMonth() + 1}.${year}`; };

export const MEMENTOS = {
  // a torn page of the notebook: ordinary, a clue
  page: { paint(g) { table(g); closeGlow(g, 80, 62, 60, '#fff1c4', 0.25); sheet(g, 46, 26, 66, 80); for (let x = 46; x < 112; x += 4) px(g, x, 26, '#2a2230'); rect(g, 47, 27, 64, 1, '#b9463b'); scribble(g, 52, 36, 54, 12, 3); } },
  // a steamship ticket, years old
  ticket: { paint(g, s, o) {
    table(g); closeGlow(g, 80, 60, 56, '#fff1c4', 0.22);
    sheet(g, 30, 40, 100, 46, '#e8dcbc', '#b9a982'); rect(g, 31, 41, 98, 8, '#8c3129');
    drawText(g, 'PASSAGE', 34, 43, '#f3e3c0'); drawText(g, 'NO. 0417', 92, 43, '#f3e3c0');
    for (let y = 41; y < 85; y += 3) px(g, 108, y, '#9a8a62'); // perforation
    // the ship, small, two funnels
    rect(g, 40, 70, 46, 5, '#2a2633'); rect(g, 50, 64, 26, 6, '#cfc8b8'); rect(g, 56, 56, 4, 8, '#c9922f'); rect(g, 66, 56, 4, 8, '#c9922f'); rect(g, 56, 56, 4, 2, '#1b1a2b'); rect(g, 66, 56, 4, 2, '#1b1a2b');
    drawText(g, dateOf(o.arrived, 1911), 40, 78, '#5a4a30');
    drawText(g, 'ONE', 112, 58, '#5a4a30'); drawText(g, 'WAY', 112, 66, '#5a4a30');
  } },
  // a pressed flower in a book, dated
  flower: { paint(g, s, o) {
    table(g); closeGlow(g, 80, 60, 64, '#fff1c4', 0.22);
    shadow(g, 22, 22, 116, 84); rect(g, 22, 22, 116, 84, INK); rect(g, 23, 23, 56, 82, '#ede3c8'); rect(g, 81, 23, 56, 82, '#efe6cf'); rect(g, 79, 23, 2, 82, '#b9a982');
    scribble(g, 28, 32, 46, 9, 9, '#8f8468', 7);
    // the flower, flattened: violet petals, a dry stem
    const fx = 108, fy = 52;
    rect(g, fx, fy + 6, 1, 34, '#6b7a4a'); rect(g, fx - 6, fy + 22, 6, 1, '#6b7a4a'); ellipse(g, fx - 7, fy + 21, 3, 2, '#7d8a55');
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; ellipse(g, Math.round(fx + Math.cos(a) * 5), Math.round(fy + Math.sin(a) * 5), 3, 3, k % 2 ? '#8a6aa8' : '#9d7cbc'); }
    ellipse(g, fx, fy, 2, 2, '#d9b84a');
    drawText(g, dateOf(o.arrived, 1907), 88, 96, '#6a5a3a');
  } },
  // a black and white photograph in front of this very house, one face scratched out
  photo: { paint(g, s, o) {
    table(g); closeGlow(g, 80, 60, 64, '#fff1c4', 0.22);
    sheet(g, 34, 14, 92, 96, '#f1ece0', '#cfc6b2');
    const [pc, pg] = makeCanvas(80, 70);
    // the sky and the ground, in grey
    for (let y = 0; y < 70; y++) rect(pg, 0, y, 80, 1, y < 44 ? mix('#b8b8b8', '#9c9c9c', y / 44) : mix('#7c7c7c', '#5e5e5e', (y - 44) / 26));
    if (o.house) { const k = Math.min(56 / o.house.width, 40 / o.house.height); const w = Math.round(o.house.width * k), hh = Math.round(o.house.height * k); pg.imageSmoothingEnabled = false; pg.drawImage(o.house, 40 - w / 2, 46 - hh, w, hh); }
    else { rect(pg, 16, 18, 48, 30, '#8a8a8a'); for (let k = 0; k < 14; k++) rect(pg, 12 + k, 18 - k, 56 - 2 * k, 1, '#555'); rect(pg, 36, 32, 8, 16, '#3a3a3a'); }
    // four people in front, the third smaller (a child)
    // four people in front of it, the third smaller (a child)
    const person = (x, hh, dark) => { rect(pg, x - 3, 68 - hh, 7, hh - 6, dark ? '#262626' : '#3c3c3c'); ellipse(pg, x, 68 - hh - 2, 3, 3, '#d8d8d8'); rect(pg, x - 2, 62, 2, 6, '#222'); rect(pg, x + 1, 62, 2, 6, '#222'); };
    rect(pg, 0, 54, 80, 16, '#6a6a6a');
    person(22, 22, true); person(34, 24, false); person(46, 15, true); person(58, 21, false);
    // grey everything, then age it
    const img = pg.getImageData(0, 0, 80, 70), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11, n = (hash(i, 1, 3) - 0.5) * 18; d[i] = Math.min(255, v * 1.02 + 10 + n); d[i + 1] = Math.min(255, v + 4 + n); d[i + 2] = Math.min(255, v * 0.92 + n); }
    pg.putImageData(img, 0, 0);
    // the scratched face: the second figure's head, scored out
    pg.strokeStyle = '#f4f0e6'; pg.lineWidth = 1;
    for (const [a, b, c2, d2] of [[30, 39, 38, 46], [31, 46, 38, 38], [29, 43, 39, 42], [32, 38, 36, 47]]) { pg.beginPath(); pg.moveTo(a + 0.5, b + 0.5); pg.lineTo(c2 + 0.5, d2 + 0.5); pg.stroke(); }
    g.drawImage(pc, 40, 20);
    rect(g, 40, 92, 80, 12, '#f1ece0'); scribble(g, 48, 97, 60, 1, 4, '#8a8072');
  } },
  // a child's drawing of the lighthouse, lit
  drawing: { paint(g) {
    table(g); closeGlow(g, 80, 60, 64, '#fff1c4', 0.22);
    sheet(g, 30, 14, 100, 94, '#f6f1e3', '#d6ccb4');
    const wob = (x, y, i) => [x + Math.round(Math.sin(i * 1.7) * 0.6), y];
    // crayon sea, blue zigzags
    for (let x = 34; x < 126; x++) { const y = 92 + Math.round(Math.sin(x * 0.6) * 1.5); px(g, x, y, '#3c6ec4'); px(g, x, y + 4, '#3c6ec4'); }
    // the tower, red and white, wobbly
    for (let y = 44; y < 90; y++) { const hw = 6 + Math.round((y - 44) / 9); for (let x = 80 - hw; x <= 80 + hw; x++) { const [X, Y] = wob(x, y, y); px(g, X, Y, Math.floor((y - 44) / 8) % 2 ? '#d94a3a' : '#f6f1e3'); } px(g, 80 - hw, y, '#222'); px(g, 80 + hw, y, '#222'); }
    rect(g, 72, 36, 17, 8, '#ffd23a'); rect(g, 72, 36, 17, 1, '#222'); rect(g, 72, 43, 17, 1, '#222'); rect(g, 74, 32, 13, 4, '#222');
    // rays of light, yellow crayon
    g.strokeStyle = '#f2c230'; g.lineWidth = 2;
    for (const [a, b] of [[40, 22], [36, 40], [44, 56], [120, 22], [124, 40], [116, 56]]) { g.beginPath(); g.moveTo(80.5, 40.5); g.lineTo(a + 0.5, b + 0.5); g.stroke(); }
    // a stick figure and a sun-like moon
    rect(g, 52, 80, 1, 8, '#222'); ellipse(g, 52, 78, 2, 2, '#222'); rect(g, 49, 83, 7, 1, '#222');
  } },
  // a letter never sent, in the notebook's hand, unsigned
  letter: { paint(g) {
    table(g); closeGlow(g, 80, 60, 64, '#fff1c4', 0.25);
    sheet(g, 36, 10, 88, 104); scribble(g, 42, 18, 76, 1, 1, '#4a3f6b'); scribble(g, 42, 28, 76, 14, 5, '#4a3f6b', 5);
    rect(g, 42, 102, 30, 1, '#c9bc9a'); // where the signature should be: nothing
    // the envelope underneath, stamped, never posted
    rect(g, 20, 78, 30, 20, INK); rect(g, 21, 79, 28, 18, '#e2d6b6'); rect(g, 41, 81, 6, 7, '#b9463b');
  } },
  // a pocket watch, stopped at the hour the ship came in
  watch: { paint(g, s, o) {
    table(g); closeGlow(g, 80, 62, 54, '#fff1c4', 0.3);
    // the chain
    for (let k = 0; k < 18; k++) ellipse(g, 120 + Math.round(Math.sin(k * 0.5) * 6), 18 + k * 3, 1, 1, '#b8913a');
    ellipse(g, 80, 64, 34, 34, INK); ellipse(g, 80, 64, 33, 33, '#c9a440'); ellipse(g, 80, 64, 30, 30, '#8a6a22'); ellipse(g, 80, 64, 28, 28, '#f4efe2');
    rect(g, 76, 26, 8, 5, '#c9a440'); rect(g, 78, 24, 4, 2, INK);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; px(g, Math.round(80 + Math.sin(a) * 24), Math.round(64 - Math.cos(a) * 24), '#3a3646'); }
    const [hh, mm] = hourOf(o.arrived), am = (mm / 60) * Math.PI * 2, ah = ((hh + mm / 60) / 12) * Math.PI * 2;
    g.strokeStyle = '#1b1a2b'; g.lineWidth = 2; g.beginPath(); g.moveTo(80.5, 64.5); g.lineTo(80.5 + Math.sin(ah) * 14, 64.5 - Math.cos(ah) * 14); g.stroke();
    g.lineWidth = 1; g.beginPath(); g.moveTo(80.5, 64.5); g.lineTo(80.5 + Math.sin(am) * 21, 64.5 - Math.cos(am) * 21); g.stroke();
    ellipse(g, 80, 64, 2, 2, '#1b1a2b');
    // a crack across the glass
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(60.5, 50.5); g.lineTo(72.5, 60.5); g.lineTo(70.5, 72.5); g.stroke();
  } },
  // a visiting card with the name given to the purser (the name itself is real text, on top)
  card: { paint(g) {
    table(g); closeGlow(g, 80, 62, 60, '#fff1c4', 0.3);
    sheet(g, 28, 36, 104, 56, '#f8f4ea', '#d9d0bc'); rect(g, 33, 41, 94, 1, '#d9d0bc'); rect(g, 33, 86, 94, 1, '#d9d0bc');
  }, text: { x: 28, y: 36, w: 104, h: 56 } },
};

// A live close-up: the painter every frame (the dust drifts), sharp, as large as the stage allows.
export function mementoCanvas(kind, o = {}) {
  const M = MEMENTOS[kind] || MEMENTOS.page;
  const [cv, g] = makeCanvas(AW, AH);
  const wrap = h('div', { class: 'mm' }, cv);
  wrap.style.cssText = 'position:relative;width:min(96vw,calc((100vh - 2 * max(12vh,86px) - 12px) * 4 / 3));aspect-ratio:4/3';
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;box-shadow:0 10px 40px #000';
  if (M.text) {
    const t = M.text, name = h('div', {}, o.name || '');
    name.style.cssText = `position:absolute;left:${(100 * t.x) / AW}%;top:${(100 * t.y) / AH}%;width:${(100 * t.w) / AW}%;height:${(100 * t.h) / AH}%;display:flex;align-items:center;justify-content:center;font:italic clamp(18px,4.2vw,38px) Georgia,"Times New Roman",serif;color:#2a2318;letter-spacing:.02em;text-align:center;padding:0 6%`;
    wrap.append(name);
  }
  let alive = true, raf = 0; const t0 = performance.now(), base = makeCanvas(AW, AH);
  M.paint(base[1], { t: 0 }, o);
  const frame = (now) => {
    if (!alive) return;
    g.drawImage(base[0], 0, 0);
    if (!reducedMotion()) closeDust(g, (now - t0) / 1000);
    closeVignette(g);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return { el: wrap, stop: () => { alive = false; cancelAnimationFrame(raf); } };
}

// the lighthouse, small, for the notebook's last page
export const lighthouseThumb = () => paintLighthouse({ w: 8, h: 5 }).canvas;
export { textWidth };
