// The steamship, illustrated (the story's second register): about 1910, side view, bow to the right:
// a long black hull of riveted plates with a red boot-topping, two rows of portholes, three decks of
// white superstructure, the bridge forward, lifeboats on their davits, two great raked funnels, buff
// with black tops, ventilators, two masts with their rigging. Painted once at the size it is shown.
//   paintShip(lenPx) -> { canvas, lit, water (y of the waterline), funnels: [[x, y]], bow, stern }
// In ship units: the hull is 1000 long, the waterline at y = 0, up is negative.
import { canvas, lin, rad, hexA, rnd, smooth } from '../paint.js';

export function paintShip(lenPx) {
  const s = lenPx / 1000, ox = 60 * s, oy = 470 * s;
  const [c, g] = canvas(1120 * s, 520 * s), [l, lg] = canvas(1120 * s, 520 * s);
  const X = (x) => ox + x * s, Y = (y) => oy + y * s;
  const r = rnd(7);
  g.lineJoin = 'round'; g.lineCap = 'round';

  // ---- masts and rigging first (behind everything)
  const mast = (x, top, rake = 14) => {
    g.strokeStyle = '#2b2a33'; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(X(x), Y(-80)); g.lineTo(X(x - rake), Y(top)); g.stroke();
    g.lineWidth = 3 * s; g.beginPath(); g.moveTo(X(x - rake * 0.8 - 22), Y(top + 70)); g.lineTo(X(x - rake * 0.8 + 22), Y(top + 70)); g.stroke(); // the yard
    g.fillStyle = '#2b2a33'; g.fillRect(X(x - rake * 0.75 - 9), Y(top + 105), 18 * s, 12 * s); // the crow's nest
    return [X(x - rake), Y(top)];
  };
  const fore = mast(880, -430), main = mast(120, -410);
  g.strokeStyle = 'rgba(40,38,52,0.85)'; g.lineWidth = 1.4 * s;
  const rope = (a, b) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
  rope(fore, [X(995), Y(-95)]); rope(main, [X(18), Y(-84)]); rope(fore, main);
  for (const k of [0, 1, 2]) { rope(fore, [X(840 + k * 18), Y(-82)]); rope(main, [X(150 - k * 18), Y(-80)]); }
  rope([X(400), Y(-318)], fore); rope([X(542), Y(-320)], fore); // funnel stays

  // ---- the hull
  // smooth() takes points in canvas space: map once
  const hp = (pts) => pts.map(([x, y]) => [X(x), Y(y)]);
  g.beginPath();
  smooth(g, hp([[30, 0], [400, 6], [930, 4], [966, -18]]));
  g.lineTo(X(1000), Y(-98));
  smooth(g, hp([[1000, -98], [820, -84], [500, -77], [200, -79], [42, -88]]));
  g.bezierCurveTo(X(12), Y(-60), X(10), Y(-22), X(30), Y(0));
  g.closePath();
  g.save(); g.clip();
  g.fillStyle = lin(g, 0, Y(-100), 0, Y(6), [[0, '#2a2833'], [0.08, '#1c1b24'], [0.75, '#121119'], [1, '#0c0b11']]); g.fillRect(0, 0, c.width, c.height);
  // the boot-topping, red, at the waterline
  g.fillStyle = lin(g, 0, Y(-16), 0, Y(6), [[0, '#7c2a22'], [1, '#4a1712']]); g.fillRect(0, Y(-16), c.width, 30 * s);
  g.fillStyle = 'rgba(230,200,140,0.6)'; g.fillRect(0, Y(-17.5), c.width, 1.6 * s);
  // plates and rivets: strakes along, butts across
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1.2 * s;
  for (const y of [-30, -48, -64]) { g.beginPath(); g.moveTo(0, Y(y)); g.lineTo(c.width, Y(y)); g.stroke(); }
  for (let x = 40; x < 1000; x += 34 + r() * 10) { g.beginPath(); g.moveTo(X(x), Y(-88)); g.lineTo(X(x), Y(-17)); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.07)'; for (let x = 40; x < 1000; x += 6) for (const y of [-31, -49, -65]) g.fillRect(X(x), Y(y) - s, s, s);
  // a sheen where the sky catches the hull
  g.fillStyle = lin(g, 0, Y(-90), 0, Y(-60), [[0, 'rgba(120,140,190,0.18)'], [1, 'rgba(120,140,190,0)']]); g.fillRect(0, Y(-92), c.width, 34 * s);
  g.restore();
  g.strokeStyle = '#06060a'; g.lineWidth = 2 * s; g.stroke();
  // the gilt line under the sheer and the name at the bow
  g.strokeStyle = 'rgba(214,170,90,0.7)'; g.lineWidth = 1.6 * s; g.beginPath(); smooth(g, hp([[60, -80], [300, -72], [600, -70], [900, -78], [985, -86]])); g.stroke();
  g.fillStyle = 'rgba(214,190,140,0.55)'; g.font = `italic ${11 * s}px Georgia,serif`; g.fillText('· · · · · ·', X(905), Y(-58));
  // the anchor, at the bow
  g.strokeStyle = '#3a3846'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(X(950), Y(-74)); g.lineTo(X(950), Y(-52)); g.moveTo(X(940), Y(-58)); g.quadraticCurveTo(X(950), Y(-48), X(960), Y(-58)); g.stroke();

  // ---- portholes: two rows, dark brass rims; their light goes on the lit layer
  const holes = [];
  for (const [y, from, to] of [[-40, 70, 930], [-56, 90, 915]]) for (let x = from; x < to; x += 21) { if (x > 860 && y === -56) continue; holes.push([x, y]); }
  for (const [x, y] of holes) {
    g.fillStyle = '#5a4a2c'; g.beginPath(); g.arc(X(x), Y(y), 3 * s, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1a2133'; g.beginPath(); g.arc(X(x), Y(y), 2 * s, 0, Math.PI * 2); g.fill();
    if (r() < 0.28) continue; // a dark cabin
    lg.fillStyle = rad(lg, X(x), Y(y), 0, 9 * s, [[0, 'rgba(255,236,170,1)'], [0.3, 'rgba(255,200,110,0.65)'], [1, 'rgba(255,170,80,0)']]); lg.beginPath(); lg.arc(X(x), Y(y), 9 * s, 0, Math.PI * 2); lg.fill();
    lg.fillStyle = r() < 0.5 ? '#fff3cf' : '#ffd9a0'; lg.beginPath(); lg.arc(X(x), Y(y), 1.9 * s, 0, Math.PI * 2); lg.fill();
  }

  // ---- the superstructure: three decks, white, lit from above and the left
  const deck = (x0, x1, y0, y1, shade = 0) => {
    g.fillStyle = lin(g, 0, Y(y1), 0, Y(y0), [[0, '#f1ece0'], [0.65, shade ? '#cfc8b8' : '#ddd6c6'], [1, '#b8b0a0']]); g.fillRect(X(x0), Y(y1), (x1 - x0) * s, (y0 - y1) * s);
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(X(x0), Y(y0) - 3 * s, (x1 - x0) * s, 3 * s); // the shadow under the deck edge
    g.fillStyle = '#8a8476'; g.fillRect(X(x0 - 4), Y(y1) - 2 * s, (x1 - x0 + 8) * s, 2.5 * s); // the deck's edge
  };
  const windows = (x0, x1, y, step, w = 7, hh = 9, lit = 0.9) => {
    for (let x = x0; x < x1; x += step) {
      g.fillStyle = '#26304a'; g.fillRect(X(x), Y(y), w * s, hh * s);
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(X(x), Y(y), w * s, 1.4 * s);
      if (r() < lit) { lg.fillStyle = `rgba(255,${190 + Math.floor(r() * 40)},${110 + Math.floor(r() * 50)},${0.75 + r() * 0.2})`; lg.fillRect(X(x), Y(y), w * s, hh * s); lg.fillStyle = rad(lg, X(x + w / 2), Y(y + hh / 2), 0, 16 * s, [[0, 'rgba(255,190,100,0.45)'], [1, 'rgba(255,190,100,0)']]); lg.fillRect(X(x - 12), Y(y - 10), (w + 24) * s, (hh + 20) * s); }
    }
  };
  deck(170, 830, -80, -118); windows(182, 820, -108, 15, 8, 10, 0.7);
  deck(240, 780, -118, -146, 1); windows(252, 770, -140, 13, 6, 8, 0.55);
  deck(320, 700, -146, -164);
  // the bridge, forward, with its wings
  deck(705, 800, -146, -184); windows(712, 795, -178, 11, 7, 9, 1);
  g.fillStyle = '#8a8476'; g.fillRect(X(690), Y(-186), 125 * s, 3 * s);
  // railings
  g.strokeStyle = 'rgba(70,66,60,0.9)'; g.lineWidth = 1 * s;
  for (const [x0, x1, y] of [[170, 830, -126], [240, 780, -154], [800, 990, -96], [40, 170, -94]]) { g.beginPath(); g.moveTo(X(x0), Y(y)); g.lineTo(X(x1), Y(y)); g.stroke(); for (let x = x0; x <= x1; x += 9) { g.beginPath(); g.moveTo(X(x), Y(y)); g.lineTo(X(x), Y(y + 8)); g.stroke(); } }
  // lifeboats on the boat deck, under their davits
  for (const x of [338, 392, 600, 654]) {
    g.strokeStyle = '#4a4740'; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(X(x - 4), Y(-164)); g.quadraticCurveTo(X(x - 6), Y(-196), X(x + 6), Y(-196)); g.moveTo(X(x + 44), Y(-164)); g.quadraticCurveTo(X(x + 42), Y(-196), X(x + 34), Y(-196)); g.stroke();
    g.beginPath(); g.moveTo(X(x), Y(-182)); g.quadraticCurveTo(X(x + 20), Y(-168), X(x + 40), Y(-182)); g.lineTo(X(x + 44), Y(-188)); g.lineTo(X(x - 4), Y(-188)); g.closePath();
    g.fillStyle = lin(g, 0, Y(-188), 0, Y(-172), [[0, '#f6f2e8'], [1, '#a8a294']]); g.fill();
    g.fillStyle = '#6a3a28'; g.fillRect(X(x - 2), Y(-190), 44 * s, 2.5 * s);
  }
  // ventilators: cowls turned to the wind
  for (const x of [300, 470, 520, 690]) { g.fillStyle = '#d8d1c0'; g.fillRect(X(x), Y(-182), 6 * s, 18 * s); g.beginPath(); g.ellipse(X(x + 6), Y(-184), 8 * s, 6 * s, 0, Math.PI * 0.9, Math.PI * 2.2); g.fill(); g.fillStyle = '#7a2a22'; g.beginPath(); g.ellipse(X(x + 8), Y(-184), 4 * s, 4 * s, 0, 0, Math.PI * 2); g.fill(); }

  // ---- two great funnels, raked aft, buff with black tops
  const funnels = [];
  for (const fx of [430, 565]) {
    const rake = 34, bot = -164, top = -350, w = 62;
    const at = (y) => fx - ((y - bot) / (top - bot)) * rake; // centre at height y
    g.beginPath(); g.moveTo(X(at(bot) - w / 2), Y(bot)); g.lineTo(X(at(top) - w / 2), Y(top)); g.lineTo(X(at(top) + w / 2), Y(top)); g.lineTo(X(at(bot) + w / 2), Y(bot)); g.closePath();
    g.save(); g.clip();
    const x0 = X(at(-260) - w / 2), x1 = X(at(-260) + w / 2);
    g.fillStyle = lin(g, x0, 0, x1, 0, [[0, '#f0c47a'], [0.25, '#d9a24a'], [0.7, '#b07a2c'], [1, '#6e4a18']]); g.fillRect(0, Y(top), c.width, (bot - top) * s);
    g.fillStyle = lin(g, x0, 0, x1, 0, [[0, '#3a3842'], [0.3, '#1d1c24'], [1, '#08080c']]); g.fillRect(0, Y(top), c.width, 52 * s); // the black top
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, Y(top + 52), c.width, 3 * s);
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (const y of [-230, -190]) g.fillRect(0, Y(y), c.width, 2 * s); // the bands of the plates
    g.restore();
    g.fillStyle = '#121118'; g.beginPath(); g.ellipse(X(at(top)), Y(top), (w / 2 + 3) * s, 6 * s, 0, 0, Math.PI * 2); g.fill(); // the rim
    g.strokeStyle = '#3a3a42'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(X(at(bot) + w / 2 + 6), Y(bot)); g.lineTo(X(at(top) + w / 2 + 4), Y(top + 10)); g.stroke(); // the steam pipe
    funnels.push([X(at(top)), Y(top)]);
  }
  // ---- the night over it all: the paint goes blue and dim; only the lit layer stays warm
  g.save(); g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(28,38,70,0.48)'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = lin(g, 0, 0, 0, c.height, [[0, 'rgba(10,14,30,0.25)'], [1, 'rgba(10,14,30,0)']]); g.fillRect(0, 0, c.width, c.height);
  // weather: streaks of rust and grime down the hull and the funnels
  const rr = rnd(17);
  for (let i = 0; i < 260; i++) { const x = rr() * c.width, y = Y(-90) + rr() * 80 * s, len = (6 + rr() * 30) * s; g.fillStyle = `rgba(${rr() < 0.5 ? '90,60,40' : '0,0,0'},${0.05 + rr() * 0.08})`; g.fillRect(x, y, (0.8 + rr()) * s, len); }
  g.restore();
  // masthead lights
  for (const [x, y] of [fore, main]) { lg.fillStyle = rad(lg, x, y, 0, 14 * s, [[0, '#fff6d8'], [1, 'rgba(255,240,200,0)']]); lg.beginPath(); lg.arc(x, y, 14 * s, 0, Math.PI * 2); lg.fill(); }
  return { canvas: c, lit: l, water: oy, funnels, bow: X(1000), stern: X(20), scale: s, x0: ox };
}

// smoke: soft grey puffs, torn by the wind (drawn every frame by the scenes)
export class Smoke {
  constructor(seed = 3) { this.p = []; this.r = rnd(seed); this.last = 0; }
  step(t, sources, wind = 1, rate = 1, scale = 1) {
    const dt = Math.min(0.1, t - this.last); this.last = t;
    for (const [x, y] of sources) if (this.r() < dt * 22 * rate) this.p.push({ x: x + (this.r() - 0.5) * 10 * scale, y, r: 16 * scale, a: 0.75, vx: -(40 + this.r() * 30) * wind * scale, vy: -(16 + this.r() * 10) * scale, born: t });
    for (const q of this.p) { q.x += q.vx * dt; q.y += q.vy * dt; q.r += 22 * dt * scale; q.a -= dt * 0.09; q.vx *= 1 + dt * 0.3; }
    this.p = this.p.filter((q) => q.a > 0);
  }
  draw(g, tint = '120,124,140') {
    for (const q of this.p) { g.fillStyle = rad(g, q.x, q.y, 0, q.r, [[0, `rgba(${tint},${q.a * 0.5})`], [0.6, `rgba(${tint},${q.a * 0.25})`], [1, `rgba(${tint},0)`]]); g.beginPath(); g.arc(q.x, q.y, q.r, 0, Math.PI * 2); g.fill(); }
  }
}
export { hexA };
