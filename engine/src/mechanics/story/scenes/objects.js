// The mementos and the notebook, illustrated (the story's second register): things on a dark table
// under a lamp, seen from above, painted once at the size of the screen.
//   objectPainter(kind) -> painter for view(): page, ticket, flower, photo, drawing, letter, watch, card,
//   notebook (the soaked notebook on the quay's boards; dry: 1 at the end), leaf (a page with P.text)
// P: { name, text, arrived (ms), house: { roof, wide } (the shape of this house, for the photograph) }
import { canvas, lin, rad, glow, rnd, smooth, soften, paper, table, shadowRect, handwrite, SERIF, rain, C } from '../paint.js';

const dateOf = (ms, year) => { const d = new Date(ms || Date.now()); return `${d.getDate()} . ${d.getMonth() + 1} . ${year}`; };
const hourOf = (ms) => { const d = new Date(ms || Date.now()); return [d.getHours() % 12, d.getMinutes()]; };
// the object's box: centred, as large as the screen allows, a little above the middle (the caption
// sits in the bottom bar)
const box = (W, H, aspect, k = 0.62) => { let w = Math.min(W * 0.86, H * k * aspect), hh = w / aspect; if (hh > H * k) { hh = H * k; w = hh * aspect; } return { x: (W - w) / 2, y: (H - hh) / 2 - H * 0.02, w, h: hh }; };

function inkScribble(g, x, y, w, lines, gap, size, seed, color = 'rgba(36,48,94,0.85)') {
  const r = rnd(seed); g.save(); g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = Math.max(1, size * 0.09);
  for (let j = 0; j < lines; j++) {
    let cx = x; const end = x + w * (0.75 + r() * 0.25), yy = y + j * gap;
    g.beginPath(); g.moveTo(cx, yy);
    while (cx < end) { const step = size * (0.25 + r() * 0.3); g.quadraticCurveTo(cx + step / 2, yy - size * (0.2 + r() * 0.5), cx + step, yy + (r() - 0.5) * size * 0.15); cx += step; if (r() < 0.12) { cx += size * 0.4; g.moveTo(cx, yy); } }
    g.stroke();
  }
  g.restore();
}

const PAINT = {
  // a page of the notebook, torn out, in the hand of the notebook (illegible: the memento; legible: a page back)
  page(g, W, H, P) {
    table(g, W, H, { seed: 3 }); const b = box(W, H, 0.72);
    g.save(); g.translate(W / 2, H / 2); g.rotate(-0.04); g.translate(-W / 2, -H / 2);
    shadowRect(g, b.x, b.y, b.w, b.h, b.w * 0.06, 0.6);
    paper(g, b.x, b.y, b.w, b.h, { ruled: true, seed: 5 });
    // the torn edge on the left: a ragged strip of the table showing through
    g.fillStyle = '#1d140f'; g.beginPath(); g.moveTo(b.x - 2, b.y); const r = rnd(8);
    for (let y = b.y; y <= b.y + b.h; y += b.h / 40) g.lineTo(b.x + b.w * (0.01 + r() * 0.02), y);
    g.lineTo(b.x - 2, b.y + b.h); g.fill();
    if (P.text) handwrite(g, P.text, b.x + b.w * 0.09, b.y + b.h * 0.16, b.w * 0.82, b.h * 0.052, { seed: 3 });
    else inkScribble(g, b.x + b.w * 0.09, b.y + b.h * 0.17, b.w * 0.8, 13, b.h * 0.062, b.h * 0.05, 3);
    // a water stain
    g.fillStyle = 'rgba(120,90,50,0.12)'; g.beginPath(); g.ellipse(b.x + b.w * 0.7, b.y + b.h * 0.75, b.w * 0.16, b.h * 0.09, 0.3, 0, Math.PI * 2); g.fill();
    g.restore();
  },
  // a steamship ticket, years old: card stock, printed letters, an engraving of the ship, a red stamp
  ticket(g, W, H, P) {
    table(g, W, H, { seed: 6 }); const b = box(W, H, 1.9, 0.5);
    g.save(); g.translate(W / 2, H / 2); g.rotate(0.03); g.translate(-W / 2, -H / 2);
    shadowRect(g, b.x, b.y, b.w, b.h, b.w * 0.04, 0.6);
    paper(g, b.x, b.y, b.w, b.h, { color: '#e6d7b4', seed: 9, edge: 0.4 });
    const u = b.h / 100;
    g.fillStyle = '#7a2a22'; g.fillRect(b.x, b.y, b.w, 17 * u);
    g.fillStyle = '#f0e4c6'; g.font = `${9 * u}px ${SERIF}`; g.textBaseline = 'middle';
    g.fillText('PASSAGE  ·  THIRD CLASS', b.x + 6 * u, b.y + 8.5 * u);
    g.textAlign = 'right'; g.fillText('No. 0417', b.x + b.w * 0.74, b.y + 8.5 * u); g.textAlign = 'left';
    // the perforation and the stub
    g.fillStyle = '#1d140f'; for (let y = b.y + 2 * u; y < b.y + b.h; y += 5 * u) { g.beginPath(); g.arc(b.x + b.w * 0.78, y, 1.2 * u, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#3a2e20'; g.font = `italic ${10 * u}px ${SERIF}`; g.fillText('One way.', b.x + b.w * 0.81, b.y + 45 * u);
    g.font = `${6.5 * u}px ${SERIF}`; g.fillText('NOT TRANSFERABLE', b.x + b.w * 0.81, b.y + 60 * u);
    // an engraving of the ship, in fine lines
    const sx = b.x + 8 * u, sy = b.y + 68 * u, sw = b.w * 0.42;
    g.strokeStyle = '#3a2e20'; g.lineWidth = 0.7 * u;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + sw, sy); g.lineTo(sx + sw * 1.04, sy - 9 * u); g.lineTo(sx + sw * 0.03, sy - 8 * u); g.closePath(); g.stroke();
    for (let y = sy - 7 * u; y < sy; y += 1.6 * u) { g.beginPath(); g.moveTo(sx + 2 * u, y); g.lineTo(sx + sw, y); g.stroke(); }
    g.strokeRect(sx + sw * 0.2, sy - 16 * u, sw * 0.6, 8 * u);
    for (const f of [0.38, 0.55]) { g.beginPath(); g.moveTo(sx + sw * f, sy - 16 * u); g.lineTo(sx + sw * (f - 0.02), sy - 34 * u); g.lineTo(sx + sw * (f + 0.06), sy - 34 * u); g.lineTo(sx + sw * (f + 0.08), sy - 16 * u); g.stroke(); g.fillStyle = '#3a2e20'; g.fillRect(sx + sw * (f - 0.02), sy - 34 * u, sw * 0.08, 4 * u); }
    g.fillStyle = '#3a2e20'; g.font = `${8 * u}px ${SERIF}`; g.fillText(dateOf(P.arrived, 1911), b.x + b.w * 0.5, b.y + 32 * u);
    g.font = `${6 * u}px ${SERIF}`; g.fillText('DEPARTURE', b.x + b.w * 0.5, b.y + 24 * u);
    // the stamp: red ink, pressed crooked
    g.save(); g.translate(b.x + b.w * 0.6, b.y + 62 * u); g.rotate(-0.25); g.strokeStyle = 'rgba(160,30,30,0.7)'; g.lineWidth = 1.6 * u; g.beginPath(); g.arc(0, 0, 14 * u, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(0, 0, 11 * u, 0, Math.PI * 2); g.stroke(); g.fillStyle = 'rgba(160,30,30,0.7)'; g.font = `bold ${5 * u}px ${SERIF}`; g.textAlign = 'center'; g.fillText('BOARDED', 0, 0); g.restore();
    g.restore();
  },
  // a pressed flower in a book, dated
  flower(g, W, H, P) {
    table(g, W, H, { seed: 7 }); const b = box(W, H, 1.45, 0.66);
    shadowRect(g, b.x, b.y, b.w, b.h, b.w * 0.05, 0.6);
    g.fillStyle = '#3a2418'; g.fillRect(b.x - b.w * 0.015, b.y - b.h * 0.02, b.w * 1.03, b.h * 1.04); // the cover
    paper(g, b.x, b.y, b.w / 2, b.h, { color: '#e9ddc0', seed: 2 }); paper(g, b.x + b.w / 2, b.y, b.w / 2, b.h, { color: '#ece1c6', seed: 3 });
    g.fillStyle = lin(g, b.x + b.w * 0.46, 0, b.x + b.w * 0.54, 0, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(60,40,20,0.35)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(b.x + b.w * 0.46, b.y, b.w * 0.08, b.h); // the gutter
    inkScribble(g, b.x + b.w * 0.06, b.y + b.h * 0.12, b.w * 0.36, 14, b.h * 0.055, b.h * 0.03, 4, 'rgba(60,50,40,0.55)');
    // the flower, flattened: a violet, its petals gone thin and brown at the edges, a dry stem
    const fx = b.x + b.w * 0.74, fy = b.y + b.h * 0.42, u = b.h / 100;
    g.strokeStyle = '#6b6a3a'; g.lineWidth = 1.2 * u; g.beginPath(); smooth(g, [[fx, fy + 4 * u], [fx - 2 * u, fy + 25 * u], [fx + 3 * u, fy + 45 * u]]); g.stroke();
    g.fillStyle = '#7d7a45'; g.beginPath(); g.ellipse(fx - 6 * u, fy + 28 * u, 6 * u, 2.4 * u, -0.6, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2; g.save(); g.translate(fx + Math.cos(a) * 6 * u, fy + Math.sin(a) * 6 * u); g.rotate(a + Math.PI / 2);
      g.fillStyle = rad(g, 0, 0, 0, 9 * u, [[0, '#8e6aa8'], [0.7, '#6e4f86'], [1, '#7a5a40']]); g.beginPath(); g.ellipse(0, 0, 5.5 * u, 8.5 * u, 0, 0, Math.PI * 2); g.fill(); g.restore();
    }
    g.fillStyle = '#d9b84a'; g.beginPath(); g.arc(fx, fy, 2.2 * u, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(120,80,40,0.15)'; g.beginPath(); g.ellipse(fx, fy + 10 * u, 16 * u, 26 * u, 0, 0, Math.PI * 2); g.fill(); // the stain it left
    handwrite(g, dateOf(P.arrived, 1907), b.x + b.w * 0.6, b.y + b.h * 0.9, b.w * 0.35, b.h * 0.05, { color: '#5a4a30', seed: 8 });
  },
  // a black and white family photograph in front of this very house; one face scratched away
  photo(g, W, H, P) {
    table(g, W, H, { seed: 9 }); const b = box(W, H, 0.8, 0.7);
    g.save(); g.translate(W / 2, H / 2); g.rotate(-0.025); g.translate(-W / 2, -H / 2);
    shadowRect(g, b.x, b.y, b.w, b.h, b.w * 0.05, 0.65);
    // the card mount, worn, with a deckled edge
    g.fillStyle = '#e8dfcb'; g.beginPath(); const r = rnd(4), step = b.w / 60;
    for (let x = b.x; x <= b.x + b.w; x += step) g.lineTo(x, b.y + r() * step * 0.6);
    for (let y = b.y; y <= b.y + b.h; y += step) g.lineTo(b.x + b.w - r() * step * 0.6, y);
    for (let x = b.x + b.w; x >= b.x; x -= step) g.lineTo(x, b.y + b.h - r() * step * 0.6);
    for (let y = b.y + b.h; y >= b.y; y -= step) g.lineTo(b.x + r() * step * 0.6, y);
    g.fill();
    // the picture itself: painted on its own canvas, softened (the focus of an old lens), then toned
    const pw = b.w * 0.86, ph = b.h * 0.78, px = b.x + (b.w - pw) / 2, py = b.y + b.w * 0.07;
    const [pc, pg] = canvas(pw, ph), u = ph / 100;
    pg.fillStyle = lin(pg, 0, 0, 0, ph, [[0, '#d8d4cc'], [0.55, '#b8b2a6'], [0.56, '#8a847a'], [1, '#6a645a']]); pg.fillRect(0, 0, pw, ph);
    // the house: this house's shape, roughly (a wide roof or a tall gable), two storeys, a door, windows
    const hw = pw * (P.house?.wide ? 0.78 : 0.6), hh = ph * 0.42, hx = (pw - hw) / 2, hy = ph * 0.56 - hh;
    pg.fillStyle = '#9a948a'; pg.fillRect(hx, hy, hw, hh);
    pg.fillStyle = '#5a554e'; pg.beginPath(); pg.moveTo(hx - hw * 0.05, hy); pg.lineTo(hx + hw / 2, hy - hh * (P.house?.wide ? 0.45 : 0.75)); pg.lineTo(hx + hw * 1.05, hy); pg.fill();
    pg.fillStyle = '#4a4640'; pg.fillRect(hx + hw * 0.7, hy - hh * 0.55, hw * 0.08, hh * 0.3); // the chimney
    for (const [fx, fy] of [[0.15, 0.2], [0.68, 0.2], [0.15, 0.6], [0.68, 0.6]]) { pg.fillStyle = '#3a3632'; pg.fillRect(hx + hw * fx, hy + hh * fy, hw * 0.17, hh * 0.22); pg.fillStyle = '#c8c2b6'; pg.fillRect(hx + hw * (fx + 0.08), hy + hh * fy, hw * 0.012, hh * 0.22); }
    pg.fillStyle = '#2e2b28'; pg.fillRect(hx + hw * 0.43, hy + hh * 0.5, hw * 0.14, hh * 0.5);
    // the family, posed stiffly in a row: a man, a woman, a child, a young man (the scratched one)
    const fig = (cx, height, coat, head, dress) => {
      const top = ph * 0.97 - height;
      pg.fillStyle = coat; pg.beginPath();
      if (dress) { pg.moveTo(cx - height * 0.12, top + height * 0.2); pg.lineTo(cx + height * 0.12, top + height * 0.2); pg.lineTo(cx + height * 0.2, ph * 0.97); pg.lineTo(cx - height * 0.2, ph * 0.97); }
      else { pg.moveTo(cx - height * 0.14, top + height * 0.2); pg.lineTo(cx + height * 0.14, top + height * 0.2); pg.lineTo(cx + height * 0.12, ph * 0.97); pg.lineTo(cx - height * 0.12, ph * 0.97); }
      pg.fill();
      pg.fillStyle = '#d6d0c4'; pg.fillRect(cx - height * 0.03, top + height * 0.19, height * 0.06, height * 0.08); // a collar
      pg.fillStyle = head; pg.beginPath(); pg.ellipse(cx, top + height * 0.1, height * 0.075, height * 0.095, 0, 0, Math.PI * 2); pg.fill();
      pg.fillStyle = '#2a2622'; pg.beginPath(); pg.ellipse(cx, top + height * 0.04, height * 0.08, height * 0.045, 0, Math.PI, 0); pg.fill(); // hair
      pg.fillStyle = 'rgba(40,36,32,0.45)'; pg.fillRect(cx - height * 0.04, top + height * 0.09, height * 0.025, height * 0.012); pg.fillRect(cx + height * 0.015, top + height * 0.09, height * 0.025, height * 0.012); // the eyes, two shadows
      return [cx, top + height * 0.1, height];
    };
    fig(pw * 0.24, ph * 0.5, '#2c2926', '#cfc8bc', false);
    fig(pw * 0.42, ph * 0.46, '#3a3632', '#d2cbbf', true);
    fig(pw * 0.57, ph * 0.3, '#4a4640', '#d4cdc2', false);
    const sc = fig(pw * 0.74, ph * 0.49, '#2a2724', '#cdc6ba', false);
    const soft = soften(pc, 3);
    pg.clearRect(0, 0, pw, ph); pg.drawImage(soft, 0, 0);
    // tone it: silver going to sepia, a little faded at the corners, grain and spots of foxing
    const img = pg.getImageData(0, 0, pc.width, pc.height), d = img.data, rr = rnd(5);
    for (let i = 0; i < d.length; i += 4) { const v = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11, n = (rr() - 0.5) * 26; d[i] = Math.min(255, v * 1.04 + 12 + n); d[i + 1] = Math.min(255, v * 0.96 + 6 + n); d[i + 2] = Math.min(255, v * 0.8 + n); }
    pg.putImageData(img, 0, 0);
    pg.fillStyle = rad(pg, pw / 2, ph / 2, Math.min(pw, ph) * 0.3, Math.hypot(pw, ph) * 0.6, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(70,45,20,0.45)']]); pg.fillRect(0, 0, pw, ph);
    for (let i = 0; i < 18; i++) { pg.fillStyle = `rgba(140,100,50,${0.1 + rr() * 0.15})`; pg.beginPath(); pg.arc(rr() * pw, rr() * ph, (1 + rr() * 4) * u * 0.4, 0, Math.PI * 2); pg.fill(); }
    // the scratched face: gouged through the emulsion, violently, many strokes: the first thing one sees
    const [hx2, hy2, hgt] = sc, R = hgt * 0.13;
    pg.save(); pg.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const a = rr() * Math.PI * 2, len = R * (0.8 + rr() * 1.6), x0 = hx2 + Math.cos(a) * rr() * R * 0.6, y0 = hy2 + Math.sin(a) * rr() * R * 0.6, a2 = a + (rr() - 0.5) * 0.8;
      pg.strokeStyle = `rgba(250,246,236,${0.55 + rr() * 0.45})`; pg.lineWidth = (0.6 + rr() * 2.2) * u * 0.35;
      pg.beginPath(); pg.moveTo(x0 - Math.cos(a2) * len / 2, y0 - Math.sin(a2) * len / 2); pg.lineTo(x0 + Math.cos(a2) * len / 2 + (rr() - 0.5) * R * 0.3, y0 + Math.sin(a2) * len / 2); pg.stroke();
    }
    pg.fillStyle = 'rgba(245,240,228,0.8)'; pg.beginPath(); pg.ellipse(hx2, hy2, R * 0.55, R * 0.7, 0.2, 0, Math.PI * 2); pg.fill(); // the paper showing through
    for (let i = 0; i < 10; i++) { pg.strokeStyle = 'rgba(40,30,20,0.35)'; pg.lineWidth = 0.6 * u * 0.4; const a = rr() * Math.PI * 2; pg.beginPath(); pg.moveTo(hx2, hy2); pg.lineTo(hx2 + Math.cos(a) * R * 1.2, hy2 + Math.sin(a) * R * 1.2); pg.stroke(); }
    pg.restore();
    g.drawImage(pc, px, py);
    g.strokeStyle = 'rgba(60,45,30,0.4)'; g.lineWidth = 1; g.strokeRect(px, py, pw, ph);
    // a crease across the corner
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = Math.max(1, b.w / 300); g.beginPath(); g.moveTo(b.x + b.w * 0.75, b.y); g.lineTo(b.x + b.w, b.y + b.h * 0.2); g.stroke();
    handwrite(g, '', b.x, b.y, 10, 10);
    g.restore();
  },
  // a child's drawing of the lighthouse, lit: wax crayon on cheap paper
  drawing(g, W, H, P) {
    table(g, W, H, { seed: 10 }); const b = box(W, H, 0.78, 0.7), r = rnd(12), u = b.h / 100;
    g.save(); g.translate(W / 2, H / 2); g.rotate(0.035); g.translate(-W / 2, -H / 2);
    shadowRect(g, b.x, b.y, b.w, b.h, b.w * 0.05, 0.6);
    paper(g, b.x, b.y, b.w, b.h, { color: '#f4efe2', seed: 7, edge: 0.15 });
    // crayon: many thin wobbly strokes, waxy and uneven
    const crayon = (pts, color, width = 1.6, passes = 3) => { g.save(); g.strokeStyle = color; g.lineCap = 'round'; for (let p = 0; p < passes; p++) { g.globalAlpha = 0.5 + r() * 0.4; g.lineWidth = width * u * (0.7 + r() * 0.6); g.beginPath(); pts.forEach(([x, y], i) => { const X = b.x + x * b.w + (r() - 0.5) * u * 0.8, Y = b.y + y * b.h + (r() - 0.5) * u * 0.8; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.stroke(); } g.restore(); };
    const fillC = (x0, y0, x1, y1, color, dense = 1) => { for (let y = y0; y < y1; y += 0.008 / dense) crayon([[x0 + (r() - 0.5) * 0.01, y], [x1 + (r() - 0.5) * 0.01, y + 0.01]], color, 1.4, 1); };
    // the sea, blue zigzags; the night sky in dark blue scribbles
    fillC(0.04, 0.05, 0.96, 0.5, 'rgba(40,50,120,0.5)', 0.6);
    for (let k = 0; k < 4; k++) crayon(Array.from({ length: 14 }, (_, i) => [0.04 + i * 0.07, 0.8 + k * 0.04 + (i % 2) * 0.025]), '#2f63c8', 1.8, 2);
    // the tower: red and white bands, leaning a little
    const tw = (y) => 0.07 + (y - 0.3) * 0.12;
    for (let y = 0.3; y < 0.78; y += 0.012) { const band = Math.floor((y - 0.3) / 0.09) % 2; crayon([[0.5 - tw(y), y], [0.5 + tw(y), y + 0.004]], band ? '#e23d2f' : '#f2ede0', 1.6, 1); }
    crayon([[0.5 - tw(0.3), 0.3], [0.5 - tw(0.78), 0.78]], '#222', 1.4, 2); crayon([[0.5 + tw(0.3), 0.3], [0.5 + tw(0.78), 0.78]], '#222', 1.4, 2);
    // the lamp, yellow, and its rays, many, too many
    fillC(0.42, 0.22, 0.58, 0.3, '#ffcf2a', 2); crayon([[0.4, 0.22], [0.6, 0.22], [0.6, 0.3], [0.4, 0.3], [0.4, 0.22]], '#222', 1.4, 2);
    crayon([[0.42, 0.22], [0.5, 0.15], [0.58, 0.22]], '#222', 1.6, 2);
    for (const [x, y] of [[0.05, 0.08], [0.02, 0.26], [0.08, 0.42], [0.95, 0.06], [0.98, 0.24], [0.92, 0.44], [0.3, 0.04], [0.7, 0.03]]) crayon([[0.5, 0.26], [x, y]], '#f5c21a', 2.2, 2);
    // a boat, two funnels, and a stick figure waving on the shore
    crayon([[0.12, 0.74], [0.32, 0.74], [0.29, 0.79], [0.15, 0.79], [0.12, 0.74]], '#222', 1.6, 2);
    crayon([[0.18, 0.74], [0.18, 0.67]], '#e0a020', 2.5, 2); crayon([[0.24, 0.74], [0.24, 0.67]], '#e0a020', 2.5, 2);
    crayon([[0.78, 0.66], [0.78, 0.74], [0.75, 0.79], [0.78, 0.74], [0.81, 0.79]], '#222', 1.4, 2); crayon([[0.74, 0.69], [0.82, 0.66]], '#222', 1.4, 2);
    g.beginPath(); g.strokeStyle = '#222'; g.lineWidth = 1.2 * u; g.arc(b.x + 0.78 * b.w, b.y + 0.63 * b.h, 2.4 * u, 0, Math.PI * 2); g.stroke();
    g.restore();
  },
  // a letter never sent, unsigned, in the notebook's hand
  letter(g, W, H, P) {
    table(g, W, H, { seed: 11 }); const b = box(W, H, 0.74, 0.74);
    // the envelope underneath, stamped, never posted
    const e = { x: b.x - b.w * 0.25, y: b.y + b.h * 0.55, w: b.w * 0.7, h: b.w * 0.42 };
    shadowRect(g, e.x, e.y, e.w, e.h, e.w * 0.05, 0.5); paper(g, e.x, e.y, e.w, e.h, { color: '#dccfae', seed: 3 });
    g.fillStyle = '#7a2a22'; g.fillRect(e.x + e.w * 0.78, e.y + e.h * 0.08, e.w * 0.14, e.h * 0.24);
    g.save(); g.translate(W / 2, H / 2); g.rotate(0.02); g.translate(-W / 2, -H / 2);
    shadowRect(g, b.x, b.y, b.w, b.h, b.w * 0.05, 0.6);
    paper(g, b.x, b.y, b.w, b.h, { seed: 12 });
    inkScribble(g, b.x + b.w * 0.1, b.y + b.h * 0.1, b.w * 0.5, 1, 0, b.h * 0.035, 1);
    inkScribble(g, b.x + b.w * 0.1, b.y + b.h * 0.18, b.w * 0.8, 15, b.h * 0.048, b.h * 0.032, 6);
    g.strokeStyle = 'rgba(60,50,40,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(b.x + b.w * 0.55, b.y + b.h * 0.93); g.lineTo(b.x + b.w * 0.9, b.y + b.h * 0.93); g.stroke(); // where the name should be
    g.restore();
  },
  // a pocket watch, stopped at the hour the ship came in
  watch(g, W, H, P) {
    table(g, W, H, { seed: 13 }); const b = box(W, H, 1, 0.66), cx = b.x + b.w / 2, cy = b.y + b.h * 0.55, R = b.w * 0.36;
    // the chain, coiled
    g.strokeStyle = '#a8842e'; g.lineWidth = R * 0.03;
    for (let i = 0; i < 40; i++) { const a = i * 0.35, rr2 = R * (1.25 + i * 0.012), x = cx + Math.cos(a - 1.2) * rr2 * 0.5 + R * 0.6, y = b.y + i * R * 0.012; g.beginPath(); g.ellipse(x, y, R * 0.04, R * 0.025, a, 0, Math.PI * 2); g.stroke(); }
    g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = R * 0.2; g.shadowOffsetX = R * 0.05; g.shadowOffsetY = R * 0.08;
    g.fillStyle = rad(g, cx - R * 0.3, cy - R * 0.4, R * 0.1, R * 1.1, [[0, '#ffe7a0'], [0.4, '#c99a3a'], [0.8, '#7a5a1a'], [1, '#4a3510']]); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill(); g.restore();
    g.fillStyle = '#c99a3a'; g.fillRect(cx - R * 0.08, cy - R * 1.18, R * 0.16, R * 0.2); g.beginPath(); g.arc(cx, cy - R * 1.22, R * 0.09, 0, Math.PI * 2); g.fill();
    // the dial: enamel, Roman hours, a small seconds dial
    g.fillStyle = rad(g, cx - R * 0.2, cy - R * 0.2, 0, R * 0.9, [[0, '#fbf7ec'], [1, '#d9d0bc']]); g.beginPath(); g.arc(cx, cy, R * 0.86, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1b1a2b'; g.font = `${R * 0.14}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((n, i) => { const a = (i / 12) * Math.PI * 2; g.save(); g.translate(cx + Math.sin(a) * R * 0.68, cy - Math.cos(a) * R * 0.68); g.rotate(a); g.fillText(n, 0, 0); g.restore(); });
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, l = i % 5 ? 0.03 : 0.06; g.strokeStyle = '#1b1a2b'; g.lineWidth = R * 0.008; g.beginPath(); g.moveTo(cx + Math.sin(a) * R * 0.82, cy - Math.cos(a) * R * 0.82); g.lineTo(cx + Math.sin(a) * R * (0.82 - l), cy - Math.cos(a) * R * (0.82 - l)); g.stroke(); }
    g.strokeStyle = '#1b1a2b'; g.lineWidth = R * 0.006; g.beginPath(); g.arc(cx, cy + R * 0.38, R * 0.14, 0, Math.PI * 2); g.stroke();
    const [hh, mm] = hourOf(P.arrived), am = (mm / 60) * Math.PI * 2, ah = ((hh + mm / 60) / 12) * Math.PI * 2;
    const hand = (a, len, w) => { g.save(); g.translate(cx, cy); g.rotate(a); g.fillStyle = '#1b1a2b'; g.beginPath(); g.moveTo(-w, R * 0.08); g.lineTo(0, -len); g.lineTo(w, R * 0.08); g.fill(); g.restore(); };
    hand(ah, R * 0.45, R * 0.035); hand(am, R * 0.66, R * 0.022);
    g.fillStyle = '#1b1a2b'; g.beginPath(); g.arc(cx, cy, R * 0.04, 0, Math.PI * 2); g.fill();
    // the glass, cracked, and the lamp in it
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, cx - R * 0.35, cy - R * 0.4, 0, R * 0.5, [[0, 'rgba(255,240,210,0.35)'], [1, 'rgba(255,240,210,0)']]); g.beginPath(); g.arc(cx, cy, R * 0.86, 0, Math.PI * 2); g.fill(); g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = R * 0.008; g.beginPath(); g.moveTo(cx - R * 0.6, cy - R * 0.3); g.lineTo(cx - R * 0.2, cy - R * 0.05); g.lineTo(cx - R * 0.25, cy + R * 0.3); g.moveTo(cx - R * 0.2, cy - R * 0.05); g.lineTo(cx + R * 0.15, cy - R * 0.12); g.stroke();
  },
  // a visiting card: heavy stock, the name engraved
  card(g, W, H, P) {
    table(g, W, H, { seed: 14 }); const b = box(W, H, 1.75, 0.46);
    g.save(); g.translate(W / 2, H / 2); g.rotate(-0.02); g.translate(-W / 2, -H / 2);
    shadowRect(g, b.x, b.y, b.w, b.h, b.w * 0.04, 0.65);
    paper(g, b.x, b.y, b.w, b.h, { color: '#f6f1e4', seed: 15, edge: 0.18 });
    g.strokeStyle = 'rgba(120,100,70,0.35)'; g.lineWidth = Math.max(1, b.h / 200); g.strokeRect(b.x + b.w * 0.04, b.y + b.h * 0.08, b.w * 0.92, b.h * 0.84);
    const name = String(P.name || '');
    let fs = b.h * 0.2; g.font = `italic ${fs}px ${SERIF}`; while (g.measureText(name).width > b.w * 0.8 && fs > 10) { fs -= 1; g.font = `italic ${fs}px ${SERIF}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText(name, b.x + b.w / 2 + 1, b.y + b.h * 0.47 + 1.5); // the engraving's raised edge
    g.fillStyle = '#2a2318'; g.fillText(name, b.x + b.w / 2, b.y + b.h * 0.47);
    g.restore();
  },
  // the notebook as found on the quay: soaked, on wet boards, the lamp's light; dry and calm at the end
  notebook(g, W, H, P) {
    const dry = P.dry || 0;
    g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#1e1712'], [1, '#0e0a08']]); g.fillRect(0, 0, W, H);
    const r = rnd(3), bw = H / 7;
    for (let y = -bw; y < H + bw; y += bw) { g.fillStyle = r() < 0.5 ? '#2a1f17' : '#231a13'; g.save(); g.translate(0, y); g.rotate(-0.08); g.fillRect(-W * 0.1, 0, W * 1.2, bw - H * 0.006); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(-W * 0.1, bw - H * 0.006, W * 1.2, H * 0.006); g.restore(); }
    if (!dry) for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(150,170,210,${0.04 + r() * 0.06})`; g.beginPath(); g.ellipse(r() * W, r() * H, W * (0.01 + r() * 0.06), H * (0.004 + r() * 0.01), -0.08, 0, Math.PI * 2); g.fill(); } // puddles
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, W * 0.15, -H * 0.1, 0, Math.hypot(W, H) * 0.9, [[0, `rgba(255,190,110,${dry ? 0.25 : 0.32})`], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, W, H); g.restore();
    const b = box(W, H, 1.4, 0.5);
    g.save(); g.translate(b.x + b.w / 2, b.y + b.h / 2); g.rotate(-0.1); g.translate(-b.w / 2, -b.h / 2);
    shadowRect(g, 0, 0, b.w, b.h, b.w * 0.05, 0.7);
    g.fillStyle = lin(g, 0, 0, b.w, b.h, [[0, '#5a3826'], [1, '#3a2418']]); g.beginPath(); g.roundRect?.(0, 0, b.w, b.h, b.w * 0.02); g.fill();
    if (!P.empty) { g.fillStyle = '#e6dcc0'; g.fillRect(b.w * 0.015, b.h * 0.94, b.w * 0.97, b.h * 0.05); g.fillRect(b.w * 0.96, b.h * 0.03, b.w * 0.03, b.h * 0.92); } // the edges of the pages
    else { g.fillStyle = '#d8ccaa'; for (let k = 0; k < 6; k++) g.fillRect(b.w * 0.012, b.h * (0.1 + k * 0.14), b.w * 0.012, b.h * 0.05); } // the stubs of the torn pages
    // tally marks scratched into the cover, in fives: one for every crossing (the last one fresh)
    const n = P.tally || 0;
    for (let i = 0; i < n; i++) {
      const x = b.w * (0.72 + (i % 5) * 0.035), y0 = b.h * 0.12, y1 = b.h * 0.3, fresh = P.fresh && i === n - 1;
      g.strokeStyle = fresh ? 'rgba(240,220,180,0.9)' : 'rgba(200,170,130,0.45)'; g.lineWidth = Math.max(1.5, b.w / 260); g.lineCap = 'round';
      g.beginPath(); if (i % 5 === 4) { g.moveTo(b.w * 0.71, b.h * 0.26); g.lineTo(b.w * 0.86, b.h * 0.15); } else { g.moveTo(x, y0); g.lineTo(x + b.w * 0.005, y1); } g.stroke();
    }
    g.fillStyle = '#8c3129'; g.fillRect(b.w * 0.3, -b.h * 0.04, b.w * 0.025, b.h * 1.15); // the ribbon
    if (!dry) { for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(20,12,8,${0.15 + r() * 0.2})`; g.beginPath(); g.ellipse(r() * b.w, r() * b.h, b.w * (0.05 + r() * 0.12), b.h * (0.04 + r() * 0.1), r(), 0, Math.PI * 2); g.fill(); } }
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, b.w, b.h * 0.12);
    g.restore();
  },
  // a page of the notebook, back: the concept's idea in the hand of the notebook (legible)
  leaf(g, W, H, P) { PAINT.page(g, W, H, { ...P, text: P.text || ' ' }); },
};

export function objectPainter(kind) {
  const paint = PAINT[kind] || PAINT.page;
  return {
    baseKeys: ['name', 'text', 'dry', 'tally', 'fresh', 'empty'],
    base(g, W, H, P) { paint(g, W, H, P); },
    live(g, W, H, t, P) {
      // the lamp breathes a little; dust in its light
      const r = rnd(2);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 24; i++) { const x = (r() * W + t * W * 0.006 * (1 + r())) % W, y = (r() * H + Math.sin(t * 0.4 + i) * H * 0.01 + t * H * 0.004) % H; g.fillStyle = `rgba(255,230,190,${0.08 + r() * 0.12})`; g.beginPath(); g.arc(x, y, Math.max(1, H / 500) * (1 + r()), 0, Math.PI * 2); g.fill(); }
      g.restore();
      if (P.rain) rain(g, W, H, t, P.rain, 9);
    },
  };
}
export { glow, C };
