// A contact sheet of the layer's pictures, to work on the look: __hb.lifeSheet({ scale: 4 })
import { animalSheet, SHEETS } from './animals/art.js';
import { obstacleTexture, markerTexture, rewardTexture, OBSTACLE_ART } from './obstacles/art.js';
import { secretTexture } from './secrets/art.js';
import { paintingCanvas, PAINTINGS } from './secrets/paintings.js';
import { TOOLS } from './obstacles/kinds.js';
import { TOWN } from '../world/townMap.js';

export function lifeSheet({ scale = 4 } = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:50;background:#3c6a3a;display:flex;flex-wrap:wrap;gap:14px;align-content:flex-start;padding:12px;font:12px system-ui;color:#fff;overflow:auto';
  const add = (cv, label, s = scale) => { const d = document.createElement('div'); d.style.textAlign = 'center'; cv.style.cssText = `width:${cv.width * s}px;image-rendering:pixelated;display:block;margin:0 auto 3px`; d.append(cv, label); wrap.append(d); };
  for (const n of Object.keys(SHEETS)) add(animalSheet(n), n);
  for (const k of Object.keys(OBSTACLE_ART)) { add(obstacleTexture(k), k); add(obstacleTexture(k, true), `${k} open`); }
  for (const t of Object.keys(TOOLS)) add(markerTexture(t), t, 3);
  for (const r of ['chest', 'glint', 'plant']) add(rewardTexture(r), r);
  for (const s of ['apple', 'bottle', 'prints', 'muddy', 'hollow', 'note', 'lantern']) add(secretTexture(s), s);
  for (const p of Object.keys(PAINTINGS)) add(paintingCanvas(p, TOWN), p, 3);
  document.body.append(wrap);
  return 1;
}
