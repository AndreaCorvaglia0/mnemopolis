// Two ways to play (docs/GAME.md): the STORY (the arrival, the fog, remembering, locks, the lighthouse)
// or FREE STUDY: no story, no film, no fights, nothing locked; the theory, the labs and the games open
// from the first minute, and only the final test left to pass. For a class, or for whoever wants the
// course without the game around it.
//
// The way is chosen once at boot, like the language: ?mode=free|story in the address, else the saved
// choice, else the course's own (`"mode": "free"` in world.json fixes it and no choice is offered), else
// the story, with the choice shown on the title. Changing it saves the choice and reloads; the save
// file is the same in both, so nothing done in one is lost in the other. Node-safe.
import { WORLD, LANG } from '../course/_data.js';

export const MODE_KEY = 'mnemopolis-mode';
const pick = (v) => (v === 'free' || v === 'story' ? v : null);

// (pure) -> { mode, chosen, offered }: offered = the player may choose (the course has a story and does not fix the way)
export function modeOf({ world = {}, query = '', saved = null } = {}) {
  const fixed = pick(world?.mode), hasStory = world?.story !== false;
  const offered = hasStory && !fixed;
  const fromQuery = pick(new URLSearchParams(query).get('mode'));
  const chosen = fromQuery || (offered ? pick(saved) : null);
  // (a course with `"story": false` and no fixed way is the plain game, with its duels: 'story' here only means "not free study")
  return { mode: fromQuery || fixed || chosen || 'story', chosen: !!chosen || !offered, offered };
}

const read = () => { try { return typeof localStorage !== 'undefined' ? localStorage.getItem(MODE_KEY) : null; } catch (e) { return null; } };
const NOW = modeOf({ world: WORLD || {}, query: typeof location !== 'undefined' ? location.search : (typeof process !== 'undefined' && process.env?.MODE ? `?mode=${process.env.MODE}` : ''), saved: read() });
export const MODE = NOW.mode, FREE = MODE === 'free', MODE_OFFERED = NOW.offered, MODE_CHOSEN = NOW.chosen;

export const MODE_WORDS = {
  label: { en: 'Way to play', it: 'Modalità' },
  story: { en: 'Story', it: 'Storia' },
  free: { en: 'Free study', it: 'Studio libero' },
  storyHint: { en: 'A town to discover, one house at a time.', it: 'Una città da scoprire, una casa alla volta.' },
  freeHint: { en: 'Everything open at once: theory, labs, games. Only the final test.', it: 'Tutto aperto da subito: teoria, laboratori, giochi. Solo il test finale.' },
};
const t = (k) => MODE_WORDS[k][LANG] || MODE_WORDS[k].en;

// save the choice; reload only if the way really changes (opts: for tests)
export function setMode(mode, { current = MODE, reload = () => location.reload(), save = (m) => { try { localStorage.setItem(MODE_KEY, m); return true; } catch (e) { return false; } } } = {}) {
  if (!pick(mode)) return false;
  const saved = save(mode);
  if (mode === current) return false;
  try {
    const q = new URLSearchParams(location.search);
    if ((q.has('mode') || !saved) && !/^blob:/.test(location.href)) { q.set('mode', mode); location.search = q.toString(); return true; }
  } catch (e) { /* fall through */ }
  reload();
  return true;
}

// the entry of the settings list (menu and notebook)
export const modeSettings = () => (MODE_OFFERED
  ? [{ label: t('label'), on: () => true, value: () => t(MODE), toggle: () => { setMode(FREE ? 'story' : 'free'); } }]
  : []);

// The choice on the title screen, the first time (HTML, above the canvas). Resolves once a way is
// chosen and it is the one already running; choosing the other one reloads the page.
export function mountModeChoice(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc || !MODE_OFFERED || MODE_CHOSEN) return null;
  let done; const chosen = new Promise((res) => { done = res; });
  const box = doc.createElement('div');
  box.setAttribute('role', 'group'); box.setAttribute('aria-label', t('label')); box.dataset.modeChoice = '1';
  box.style.cssText = 'position:fixed;left:50%;bottom:12vh;transform:translateX(-50%);z-index:6;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;width:min(92vw,640px);font:600 17px/1.25 system-ui,sans-serif';
  for (const m of ['story', 'free']) {
    const b = doc.createElement('button');
    b.type = 'button'; b.dataset.mode = m;
    b.style.cssText = `flex:1 1 240px;min-height:84px;padding:12px 16px;border-radius:12px;border:2px solid ${m === 'story' ? '#ffcf5a' : '#4fd1c5'};cursor:pointer;color:#f1ecd9;background:rgba(13,15,30,.88);text-align:left`;
    const a = doc.createElement('div'); a.textContent = t(m); a.style.cssText = `font-size:20px;color:${m === 'story' ? '#ffcf5a' : '#4fd1c5'}`;
    const h = doc.createElement('div'); h.textContent = t(m + 'Hint'); h.style.cssText = 'font-weight:400;font-size:15px;margin-top:4px;color:#d9d6c8';
    b.append(a, h);
    b.onclick = (e) => { e.stopPropagation(); if (!setMode(m)) { box.remove(); done(m); } };
    box.append(b);
  }
  for (const ev of ['keydown', 'keyup', 'pointerdown', 'mousedown', 'touchstart']) box.addEventListener(ev, (e) => e.stopPropagation());
  doc.body.append(box);
  return { chosen, remove: () => box.remove() };
}
