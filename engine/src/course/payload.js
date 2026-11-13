// The prebuilt player (npm run build:player) reads its course here, at run time, from
//   <script type="application/json" id="mnemo-course">{ slug, course, world, labs, anims }</script>
// filled by scripts/pack.mjs or the /play/ page (src/course/packing.js). The bundled build never
// loads this file: scripts/use-course.mjs writes _data.js and _active.js with the course inside.
import { MARK } from './packing.js';

export function readPayload() {
  const el = typeof document !== 'undefined' ? document.getElementById(MARK) : null;
  const txt = el?.textContent.trim();
  if (!txt) return null;
  try { return JSON.parse(txt); } catch (e) { fail(`The course inside this file cannot be read: ${e.message}`); return null; }
}

// a plain message instead of a broken game
export function fail(text) {
  if (typeof document === 'undefined') throw new Error(text);
  const show = () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:99;display:grid;place-items:center;padding:24px;background:#0d1016;color:#e8eaf0;font:18px/1.5 system-ui,sans-serif;text-align:center'; d.textContent = text; document.body.append(d); };
  if (document.body) show(); else addEventListener('DOMContentLoaded', show);
}

// A minimal course so that the engine can start (it shows the message above).
export const EMPTY_COURSE = { id: 'empty', language: 'en', title: 'No course', subject: '', bigIdea: '', themes: [{ id: 't', name: '-', idea: '' }], concepts: [], relations: [], finalCheck: { name: 'League', size: 4, pass: 0.5 } };

// Lab code: each file is an ES module whose engine imports were rewritten to read
// globalThis.__mnemoKit. It is loaded from a Blob URL once the engine's modules have all run.
export async function loadCode(P, kit, MOUNTS, ANIMS) {
  if (!P) return;
  globalThis.__mnemoKit = kit;
  const load = async (name, src) => {
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    try { return await import(/* @vite-ignore */ url); } catch (e) { console.error(`${name}: ${e.message}`); fail(`${name} could not be loaded: ${e.message}`); return null; } finally { URL.revokeObjectURL(url); }
  };
  await Promise.all(Object.entries(P.labs || {}).map(async ([id, src]) => { const m = await load(`labs/${id}.js`, src); if (m) MOUNTS[id] = m.default || {}; }));
  if (P.anims) { const m = await load('anims.js', P.anims); if (m?.ANIMS) Object.assign(ANIMS, m.ANIMS); }
}
