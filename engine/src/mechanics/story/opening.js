// The arrival (docs/STORY.md, beat 1): night, heavy rain, the steamship comes in to the quay, its
// lights go out; three lines; the purser asks a name for the register. A staged scene of its own,
// drawn on one canvas between the cinema's bars, before the town takes over.
import { h } from '../../lab/shell.js';
import { makeCanvas, rect, px, hash, mix, fbm } from '../../art/px.js';
import { state, save } from '../../systems/state.js';
import { sfx } from '../../systems/audio.js';
import { touch } from '../../systems/view.js';
import { cinema, reducedMotion } from './cinema.js';
import { paintShip, puff, SHIP_W, SHIP_H, SHIP_WATER, FUNNELS } from './art.js';
import { S_WORDS } from './words.js';
import { tr, fill } from './config.js';

// The stage: a canvas at a low resolution (240 pixels across), scaled up crisp to the whole window.
class Stage {
  constructor(parent) {
    this.cv = h('canvas', { 'aria-hidden': 'true' });
    this.cv.style.cssText = 'position:absolute;left:0;right:0;top:max(12vh,86px);bottom:max(12vh,86px);width:100%;height:calc(100% - 2 * max(12vh,86px));image-rendering:pixelated;z-index:0;background:#05060c';
    parent.prepend(this.cv);
    this.ship = paintShip(); this.puff = puff();
    this.t0 = performance.now(); this.lights = 1; this.dock = 0; this.alive = true; this.reduced = reducedMotion();
    this.puffs = [];
    this.resize();
    this.onResize = () => this.resize();
    addEventListener('resize', this.onResize);
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  resize() {
    // the picture between the bars: wide screens see more sea around the ship, upright ones more sky
    const bar = Math.max(innerHeight * 0.12, 86), midH = Math.max(120, innerHeight - 2 * bar), W = innerWidth > midH ? 320 : 200;
    const Hh = Math.max(130, Math.min(560, Math.round((W * midH) / Math.max(1, innerWidth))));
    this.cv.width = W; this.cv.height = Hh; this.W = W; this.H = Hh;
    this.g = this.cv.getContext('2d'); this.g.imageSmoothingEnabled = false;
    this.sky = this.paintSky();
  }
  paintSky() {
    const { W, H } = this, [c, g] = makeCanvas(W, H), hz = this.horizon();
    for (let y = 0; y < hz; y++) { const t = y / hz; rect(g, 0, y, W, 1, mix('#06070f', '#161b2e', t)); }
    // clouds: low and heavy, a little lighter where they thin
    for (let y = 0; y < hz; y++) for (let x = 0; x < W; x++) { const n = fbm(x * 0.035, y * 0.11, 4, 3); if (n > 0.52) px(g, x, y, mix('#141a2c', '#252b40', Math.min(1, (n - 0.52) * 3))); }
    // a headland far off on the left, and on it a lighthouse, dark
    const hw = Math.round(W * 0.3);
    for (let x = 0; x < hw; x++) { const top = hz - 3 - Math.round(Math.sin((x / hw) * Math.PI) * 8); rect(g, x, top, 1, hz - top, '#0a0c16'); }
    const tx = Math.round(hw * 0.45), ty = hz - 11;
    rect(g, tx - 2, ty - 16, 5, 16, '#141827'); rect(g, tx - 1, ty - 22, 3, 5, '#10131f'); rect(g, tx - 3, ty - 17, 7, 1, '#1b2031'); rect(g, tx, ty - 24, 1, 2, '#141827');
    return c;
  }
  horizon() { return Math.round(this.H * (this.H > 200 ? 0.5 : 0.46)); }
  frame(now) {
    if (!this.alive) return;
    const { g, W, H } = this, t = (now - this.t0) / 1000, hz = this.horizon();
    g.drawImage(this.sky, 0, 0);
    // the sea: dark, with moving lines of swell
    for (let y = hz; y < H; y++) rect(g, 0, y, W, 1, mix('#0b1424', '#070b14', (y - hz) / (H - hz)));
    for (let k = 0; k < 70; k++) {
      const y = hz + 2 + Math.floor(hash(k, 1, 2) * (H - hz - 4)), x = (Math.floor(hash(k, 2, 2) * W) + Math.floor(t * (6 + (y - hz) * 0.15)) * (k % 2 ? 1 : -1) + W * 4) % W;
      rect(g, x, y, 3 + Math.floor((y - hz) / 20), 1, '#1d2a40');
    }
    // the quay, in the foreground on the left: planks on posts, a lamp
    const wl = Math.round(H * (H > W ? 0.72 : 0.84)), qx = Math.round(W * (H > W ? 0.22 : 0.3));
    rect(g, 0, wl - 6, qx, 4, '#3a2a20'); rect(g, 0, wl - 6, qx, 1, '#5a4030');
    for (let x = 4; x < qx; x += 14) rect(g, x, wl - 2, 3, 14, '#241a14');
    rect(g, qx - 10, wl - 34, 2, 28, '#1b1a2b'); rect(g, qx - 12, wl - 38, 6, 5, '#1b1a2b');
    const flick = 0.75 + Math.sin(t * 9) * 0.08 + (hash(Math.floor(t * 7), 1, 1) > 0.9 ? -0.3 : 0);
    g.fillStyle = `rgba(255,215,122,${(0.9 * flick).toFixed(2)})`; g.fillRect(qx - 11, wl - 37, 4, 3);
    const gl = g.createRadialGradient(qx - 9, wl - 35, 1, qx - 9, wl - 35, 16); gl.addColorStop(0, `rgba(255,200,110,${(0.22 * flick).toFixed(2)})`); gl.addColorStop(1, 'rgba(255,200,110,0)');
    g.fillStyle = gl; g.fillRect(qx - 26, wl - 52, 34, 34);
    // the ship: comes in from the right and slows to the quay
    const e = 1 - (1 - this.dock) ** 3, sx = Math.round(W + 10 - e * (W + 10 - Math.min(qx - 6, W - SHIP_W - 4))), sy = wl - SHIP_WATER + 2 + Math.round(Math.sin(t * 1.1) * (1 - e * 0.7));
    // reflections of its lights in the water
    if (this.lights > 0.02) for (let x = 24; x < SHIP_W - 14; x += 14) { g.fillStyle = `rgba(255,215,122,${(0.16 * this.lights * (0.6 + 0.4 * Math.sin(t * 2 + x))).toFixed(3)})`; g.fillRect(sx + x, wl + 4 + (x % 3), 1, 3 + (x % 4)); }
    g.drawImage(this.ship.canvas, sx, sy);
    if (this.lights > 0.01) { g.globalAlpha = this.lights; g.drawImage(this.ship.lit, sx, sy); g.globalAlpha = 1; }
    rect(g, sx, wl + 1, SHIP_W, 1, '#0b1424'); // the water over the bottom of the hull
    // smoke from the funnels, pushed back by the wind
    if (!this.reduced && this.lights > 0.2 && Math.random() < 0.18) for (const [fx, fy] of FUNNELS) this.puffs.push({ x: sx + fx - 5, y: sy + fy - 3, a: 0.6, s: 0.3 + Math.random() * 0.2 });
    for (const p of this.puffs) { p.x -= 0.9; p.y -= 0.12; p.a -= 0.008; p.s += 0.02; }
    this.puffs = this.puffs.filter((p) => p.a > 0);
    for (const p of this.puffs) { g.globalAlpha = Math.max(0, p.a * 0.45); const s = Math.round(16 * p.s); g.drawImage(this.puff, Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s); }
    g.globalAlpha = 1;
    // rain: heavy, slanting, everywhere
    if (!this.reduced || Math.floor(t * 2) % 2 === 0) {
      g.fillStyle = 'rgba(180,195,225,0.45)';
      for (let k = 0; k < Math.round(W * H / 220); k++) {
        const L = 4 + (k % 4), x0 = (hash(k, 3, 8) * (W + 40) - (t * 70 + k * 13) % (W + 40) * 0.25 + W) % (W + 40) - 20, y0 = (hash(k, 4, 8) * H + t * (150 + (k % 5) * 20)) % (H + 10) - 10;
        for (let j = 0; j < L; j++) g.fillRect(Math.round(x0 - j * 0.35), Math.round(y0 + j), 1, 1);
      }
    }
    this.raf = requestAnimationFrame((tt) => this.frame(tt));
  }
  tween(key, to, ms) { // a value glides (or jumps, with reduced motion)
    const from = this[key], t0 = performance.now();
    if (this.reduced || ms <= 0) { this[key] = to; return Promise.resolve(); }
    return new Promise((r) => { const step = (now) => { const k = Math.min(1, (now - t0) / ms); this[key] = from + (to - from) * k; if (k < 1 && this.alive) requestAnimationFrame(step); else r(); }; requestAnimationFrame(step); });
  }
  stop() { this.alive = false; cancelAnimationFrame(this.raf); removeEventListener('resize', this.onResize); this.cv.remove(); }
}

// The purser's register: a name, optional; kept only in the save on this device.
function askName(c) {
  return new Promise((resolve) => {
    const def = tr(S_WORDS.defaultName);
    const input = h('input', { type: 'text', maxlength: '24', autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'done', placeholder: def, 'aria-label': tr(S_WORDS.nameLabel), value: state.story?.name || '' });
    const sign = h('button', { type: 'button' }, tr(S_WORDS.sign));
    const box = h('div', { class: 'cn-reg', role: 'group' },
      h('small', {}, tr(S_WORDS.purser)), h('p', {}, tr(S_WORDS.askName)),
      h('label', {}, h('span', {}, tr(S_WORDS.nameLabel)), input), sign, h('em', {}, tr(S_WORDS.nameKept)));
    box.style.cssText = 'background:#efe6cf;color:#2a2318;border-radius:4px;padding:16px 18px 14px;max-width:min(90vw,380px);width:100%;box-shadow:0 8px 30px #000;font:18px Georgia,serif;display:flex;flex-direction:column;gap:10px';
    box.querySelector('small').style.cssText = 'font:600 13px system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#7a6a48';
    box.querySelector('p').style.cssText = 'margin:0;font-size:20px';
    box.querySelector('label').style.cssText = 'display:flex;flex-direction:column;gap:4px;font:14px system-ui,sans-serif;color:#6a5a3a';
    input.style.cssText = 'min-height:48px;font:italic 22px Georgia,serif;padding:0 12px;border:0;border-bottom:2px solid #6a5a3a;background:#f8f2e2;color:#2a2318;border-radius:4px 4px 0 0';
    sign.style.cssText = 'min-height:48px;border:0;border-radius:8px;background:#2a2318;color:#f3e9cf;font:700 18px system-ui,sans-serif;cursor:pointer';
    box.querySelector('em').style.cssText = 'font:13px system-ui,sans-serif;color:#7a6a48';
    c.show(box);
    const done = () => {
      const name = input.value.trim().replace(/\s+/g, ' ').slice(0, 24) || def;
      (state.story ||= {}).name = name; save();
      input.removeEventListener('keydown', key); sfx.page?.(); c.hide(); resolve(name);
    };
    const key = (e) => { if (e.key === 'Enter') { e.preventDefault(); done(); } else if (e.key === 'Escape') { e.preventDefault(); input.value = ''; done(); } e.stopPropagation(); };
    input.addEventListener('keydown', key);
    sign.onclick = done;
    setTimeout(() => { if (!touch.on) input.focus(); }, 80);
  });
}

// The whole arrival. Resolves when the town can take over.
export async function playOpening(ui) {
  let stage = null;
  await cinema(ui, async (c) => {
    stage = new Stage(c.root);
    c.root.style.background = '#05060c';
    await c.sleep(600);
    c.theme('opening');
    const docking = stage.tween('dock', 1, 9000);
    for (const line of tr(S_WORDS.opening)) await c.say(line);
    await (c.skipped ? Promise.resolve() : docking);
    stage.dock = 1;
    // the lights go out, one deck after another
    const out = stage.tween('lights', 0, 2600);
    await c.say(tr(S_WORDS.lightsOut));
    await (c.skipped ? Promise.resolve() : out);
    stage.lights = 0;
    // the register: always asked, even after a skip (the name is used later)
    const name = await askName(c);
    await c.say(fill(tr(S_WORDS.signed), { name }));
    await c.dim(1, 700);
  });
  stage?.stop();
  (state.story ||= {}).arrived = true;
  state.story.arrivedAt ||= Date.now();
  save();
}
