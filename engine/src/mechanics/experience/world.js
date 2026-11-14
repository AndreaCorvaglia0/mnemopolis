// The world that notices, in the scenes: withheld lines when a person talks, a tier change announced
// once by a person's remark, and canEnter, the hook doors and obstacles consult (today one real use:
// the shut house on the square opens to someone the town knows).
import { state, save } from '../../systems/state.js';
import { uiSound } from '../../systems/sound/index.js';
import { h } from '../../lab/shell.js';
import { NPCS } from '../../world/townMap.js';
import { canEnterAt } from './model.js';
import { XP_ON, tierNow, withheldNow, refuseLine, tellLine, tierUpLine, syncNow, atLeast, XLINES, trLine } from './active.js';

const TEASE_GAP = 3 * 60 * 1000; // a person teases the same line at most every three minutes
const DEFAULT_TEASER = { en: 'There\'s something I could tell you about this place. But—', it: 'Ci sarebbe una cosa che potrei dirti su questo posto. Ma—' };

// Before a person's dialogue: maybe they start to tell you something. Returns true if they spoke.
export async function withheldMoment(ui, key, name) {
  if (!XP_ON) return false;
  const p = withheldNow(key);
  if (!p) return false;
  const x = state.xp, now = Date.now();
  if (p.told) {
    uiSound('told');
    await ui.say([tellLine(), trLine(p.line.told)], { name });
    (x.told ||= {})[p.line.id] = now; save();
    syncNow();
    ui.toast?.(trLine({ en: 'Written in the notebook (Clues)', it: 'Annotato nel taccuino (Indizi)' }));
    return true;
  }
  if (now - (x.teased?.[key] || 0) < TEASE_GAP) return false;
  (x.teased ||= {})[key] = now; save();
  uiSound('withheld');
  await ui.say([trLine(p.line.teaser || DEFAULT_TEASER), refuseLine()], { name });
  return true;
}

// A tier change: announced once, by the nearest person (or the harbour master), with a soft sound.
export async function announceTier(ui, scene) {
  if (!XP_ON || !state.xp?.announce) return false;
  const t = state.xp.announce;
  delete state.xp.announce; save();
  if (t === 'arrival') return false;
  const pl = scene?.player;
  let who = null;
  if (pl && scene.npcs) for (const n of scene.npcs) { const d = Math.abs(n.tx - pl.tx) + Math.abs(n.ty - pl.ty); if (n.def?.id !== 'champion' && (!who || d < who.d)) who = { n, d }; }
  const name = who?.n.def.name || NPCS.find((n) => n.id === 'guide')?.name || '';
  who?.n.faceToward?.(pl.tx, pl.ty);
  uiSound('tier');
  await ui.say([tierUpLine(t)], { name });
  who?.n.face?.(who.n.home);
  return true;
}
// called often (UI.refreshQuest): keeps the save in step and announces when the town is idle
let last = 0, announcing = false;
export function xpTick(ui) {
  if (!XP_ON) return;
  const now = Date.now();
  if (now - last < 1500) return;
  last = now;
  syncNow(now);
  if (!state.xp?.announce || announcing || ui.busy) return;
  const town = ui.scene.get('Town');
  if (!town || !ui.scene.isActive('Town') || town.locked || town.player?.moving) return;
  announcing = true;
  announceTier(ui, town).finally(() => { announcing = false; });
}

// ---- canEnter: may the player go in (or through)? Today everything is allowed, except the one door
// that demonstrates it. { ok, need } — `need` names the tier that would open it.
export function canEnter(thing, s = state, tier = tierNow()) {
  return XP_ON ? canEnterAt(thing, tier) : { ok: true };
}

// The shut house on the square (world/townMap.js `home`): "Come back when they know you better", and
// above the tier a small nook: a warm room, a note, a few coins once. Nothing the main path needs.
export async function knownDoor(ui, b) {
  const r = canEnter('door:home');
  if (!r.ok) { uiSound('withheld'); await ui.say([trLine(XLINES.door.shut)[Math.floor(Math.random() * 2)]], { name: b.name }); return; }
  uiSound('door');
  const first = !state.xp?.nook;
  if (first) { state.xp.nook = Date.now(); state.insight = (state.insight || 0) + 25; save(); }
  await ui.page(() => nookPage(first));
  syncNow();
}

function nookPage(first) {
  const T = (v) => trLine(v);
  return new Promise((resolve) => {
    const cv = h('canvas', { width: 640, height: 360, style: 'width:100%;max-width:820px;aspect-ratio:16/9;border-radius:14px;display:block;margin:0 auto;background:#120d0a' });
    const done = h('button', { type: 'button', style: 'min-height:48px;padding:0 22px;border-radius:12px;border:0;background:#4fd1c5;color:#04201d;font:600 18px system-ui;cursor:pointer' }, T({ en: 'Step back', it: 'Esci' }));
    const root = h('div', { style: 'position:fixed;inset:0;z-index:22;background:#07060b;color:#f1ecd9;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:16px;font:18px/1.5 system-ui,sans-serif;overflow:auto', role: 'dialog' },
      cv,
      h('p', { style: 'max-width:640px;margin:0;text-align:center' }, T(XLINES.door.open)),
      h('p', { style: 'max-width:640px;margin:0;text-align:center;font-style:italic;color:#e8d8a8' }, T({ en: 'On the table, a note in a hand you know: "You came back. Good. The town keeps a room for those who stay."', it: 'Sul tavolo, un biglietto in una calligrafia che conosci: «Sei tornato. Bene. Il paese tiene una stanza per chi resta.»' })),
      first ? h('p', { style: 'margin:0;color:#ffcf5a' }, T({ en: 'Beside it, 25 coins.', it: 'Accanto, 25 monete.' })) : null,
      done);
    const close = () => { document.removeEventListener('keydown', key, true); root.remove(); resolve(); };
    const key = (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(); } };
    done.onclick = close; document.addEventListener('keydown', key, true);
    document.body.append(root);
    paintNook(cv.getContext('2d'));
    setTimeout(() => done.focus(), 30);
  });
}
// a small warm room, illustrated: wall, window with rain, a table under a lamp, a chair, a shelf
function paintNook(g) {
  const W = 640, H = 360;
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a1c14'); gr.addColorStop(0.62, '#3b281b'); gr.addColorStop(0.63, '#24170f'); gr.addColorStop(1, '#140c08');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // window with night and rain
  g.fillStyle = '#0d1424'; g.fillRect(420, 60, 140, 110); g.strokeStyle = '#5a3d27'; g.lineWidth = 8; g.strokeRect(420, 60, 140, 110); g.beginPath(); g.moveTo(490, 60); g.lineTo(490, 170); g.moveTo(420, 115); g.lineTo(560, 115); g.stroke();
  g.strokeStyle = 'rgba(160,190,230,0.35)'; g.lineWidth = 1; for (let i = 0; i < 26; i++) { const x = 424 + ((i * 53) % 132), y = 64 + ((i * 37) % 100); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 9); g.stroke(); }
  // shelf with jars
  g.fillStyle = '#5a3d27'; g.fillRect(70, 110, 200, 8);
  [['#7fa86a', 90], ['#c9a253', 130], ['#8a5a9a', 172], ['#6a8fb0', 214]].forEach(([c, x], i) => { g.fillStyle = c; g.fillRect(x, 82 - (i % 2) * 8, 26, 28 + (i % 2) * 8); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x + 4, 86, 4, 18); });
  // the lamp's pool of light
  const lx = 300, ly = 150;
  gr = g.createRadialGradient(lx, ly + 90, 10, lx, ly + 90, 260); gr.addColorStop(0, 'rgba(255,200,120,0.55)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#1a120c'; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, ly - 20); g.stroke();
  g.fillStyle = '#c98a3a'; g.beginPath(); g.moveTo(lx - 34, ly); g.lineTo(lx + 34, ly); g.lineTo(lx + 16, ly - 24); g.lineTo(lx - 16, ly - 24); g.closePath(); g.fill();
  g.fillStyle = '#ffe2a8'; g.beginPath(); g.ellipse(lx, ly + 2, 18, 5, 0, 0, Math.PI * 2); g.fill();
  // table, note, coins, chair
  g.fillStyle = '#6b4529'; g.fillRect(200, 250, 220, 14); g.fillRect(214, 264, 10, 70); g.fillRect(396, 264, 10, 70);
  g.save(); g.translate(290, 236); g.rotate(-0.08); g.fillStyle = '#efe4c8'; g.fillRect(0, 0, 70, 46); g.fillStyle = 'rgba(60,40,30,0.6)'; for (let i = 0; i < 4; i++) g.fillRect(8, 9 + i * 9, 50 - (i === 3 ? 22 : 0), 2); g.restore();
  g.fillStyle = '#ffcf5a'; [[372, 246], [380, 244], [376, 240]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 7, 3, 0, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = '#4a2f1d'; g.fillRect(470, 220, 60, 10); g.fillRect(470, 160, 8, 120); g.fillRect(522, 230, 8, 50); g.fillRect(474, 230, 6, 50);
  // grain and vignette
  gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
