// The arrival (docs/STORY.md, beat 1): night, heavy rain, the steamship comes in to the quay, its
// lights go out; three lines; the purser asks a name for the register. An illustrated scene
// (scenes/harbour.js, the story's second register) behind the cinema's bars, before the town.
import { h } from '../../lab/shell.js';
import { state, save } from '../../systems/state.js';
import { sfx } from '../../systems/audio.js';
import { touch } from '../../systems/view.js';
import { cinema } from './cinema.js';
import { view } from './paint.js';
import { harbourPainter } from './scenes/harbour.js';
import { S_WORDS } from './words.js';
import { tr, fill } from './config.js';

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
    c.root.style.background = '#05060c';
    await c.dim(1, 0);
    stage = view(c.root, harbourPainter(), { dock: 0, lights: 1, rain: 1, push: 0.06, pushTime: 30 });
    await c.dim(0, 1400);
    c.theme('opening');
    const docking = stage.fade('dock', 1, 11000);
    for (const line of tr(S_WORDS.opening)) await c.say(line);
    await (c.skipped ? Promise.resolve() : docking);
    stage.set({ dock: 1 });
    // the lights go out, one deck after another
    const out = stage.fade('lights', 0, 3200);
    await c.say(tr(S_WORDS.lightsOut));
    await (c.skipped ? Promise.resolve() : out);
    stage.set({ lights: 0 });
    // the register: always asked, even after a skip (the name is used later)
    const name = await askName(c);
    await c.say(fill(tr(S_WORDS.signed), { name }));
    await c.dim(1, 900);
  });
  stage?.stop();
  (state.story ||= {}).arrived = true;
  state.story.arrivedAt ||= Date.now();
  save();
}
