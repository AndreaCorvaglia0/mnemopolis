// Code as the control panel. A station shows a real snippet of the pipeline; the values you can
// change are highlighted inside the code, some lines can be switched off, and every line explains
// itself when you point at it. Nothing is typed and nothing is executed: the station recomputes
// its picture from the state of the snippet.
import { h } from './shell.js';
import { sfx } from '../systems/audio.js';

const CSS = `
.cp{background:#0b0e14;border:1px solid #232a36;border-radius:8px;font:13px/1.75 ui-monospace,Menlo,Consolas,monospace;overflow:auto;padding:8px 0}
.cp-l{display:grid;grid-template-columns:26px 1fr;align-items:baseline;padding:0 10px 0 4px;white-space:pre;border-left:3px solid transparent}
.cp-l:hover{background:#141a24}.cp-l.on{background:#2a2412;border-left-color:#ffcf5a}
.cp-l.off .cp-t{opacity:.38;text-decoration:line-through;text-decoration-color:#6f7789}
.cp-g{display:grid;place-items:center}.cp-g input{accent-color:#4fd1c5;margin:0;cursor:pointer}
.cp-t .c{color:#6f7f96}.cp-t .s{color:#b5d99c}.cp-t .k{color:#c9a1f0}.cp-t .n{color:#f0b27a}
.cp-k{font:inherit;color:#06211f;background:#4fd1c5;border:0;border-radius:4px;padding:0 3px;margin:0 1px;cursor:pointer;font-weight:600;appearance:none;-webkit-appearance:none;text-align:center}
.cp-k:hover,.cp-k:focus{background:#ffcf5a;outline:none}
.cp-note{min-height:58px;background:#151a23;border:1px solid #232a36;border-radius:8px;padding:8px 12px;font-size:14px;line-height:1.45;color:#c9cfdd}
.cp-note b{color:#ffcf5a}
.cp-legend{font-size:12px;color:#8b93a7;display:flex;gap:14px;flex-wrap:wrap}
.cp-legend i{display:inline-block;width:18px;height:11px;border-radius:3px;background:#4fd1c5;vertical-align:-1px;margin-right:4px}
.pipe-err{background:#2a1215;border:1px solid #ff7a6b;border-radius:8px;padding:10px 12px;font:12.5px/1.5 ui-monospace,Menlo,monospace;color:#ffb3a8;white-space:pre-wrap}
`;
let styled = false;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function paint(text) {
  // comment first, then strings, keywords and numbers in what is left
  const i = text.search(/(^|\s)#/), code = i < 0 ? text : text.slice(0, i + (text[i] === '#' ? 0 : 1)), com = i < 0 ? '' : text.slice(code.length);
  const html = esc(code).replace(/("[^"]*"|'[^']*')|\b(for|in|if|else|with|import|from|def|return|not|and|or|True|False|None|FROM|RUN|COPY|CMD|WORKDIR|EXPOSE)\b|\b(\d+(?:\.\d+)?(?:e-?\d+)?)\b/g,
    (m, s, k, n) => (s ? `<span class="s">${s}</span>` : k ? `<span class="k">${k}</span>` : `<span class="n">${n}</span>`));
  return html + (com ? `<span class="c">${esc(com)}</span>` : '');
}

// spec.lines: [{ t: 'text with {{knob}}', note: 'why', toggle: 'id' }]
// spec.knobs: { id: { options: [[value, label], ...], value } }   spec.toggles: { id: true }
export function codePanel(spec, onChange) {
  if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; }
  const state = { ...Object.fromEntries(Object.entries(spec.knobs || {}).map(([k, v]) => [k, v.value])), ...(spec.toggles || {}) };
  const note = h('div', { class: 'cp-note', html: spec.hint || 'Point at a line to see why it is there. <b>Highlighted values can be changed.</b>' });
  const rows = [];
  const panel = h('div', { class: 'cp' });
  spec.lines.forEach((ln, i) => {
    const t = h('span', { class: 'cp-t' });
    ln.t.split(/(\{\{\w+\}\})/).forEach((part) => {
      const m = /^\{\{(\w+)\}\}$/.exec(part);
      if (!m) { t.insertAdjacentHTML('beforeend', paint(part)); return; }
      const k = spec.knobs[m[1]];
      const sel = h('select', { class: 'cp-k', 'aria-label': m[1], onchange: () => { state[m[1]] = k.options[sel.selectedIndex][0]; fit(); sfx.tick(); onChange(state, m[1]); } },
        k.options.map(([v, label]) => h('option', { selected: v === k.value ? '' : null }, label ?? String(v))));
      const fit = () => { sel.style.width = `${k.options[sel.selectedIndex][1]?.length ?? String(k.options[sel.selectedIndex][0]).length}ch`; sel.style.boxSizing = 'content-box'; };
      fit();
      t.append(sel);
    });
    const gutter = h('span', { class: 'cp-g' });
    const row = h('div', { class: 'cp-l', onmouseenter: () => { if (ln.note) note.innerHTML = ln.note; } }, gutter, t);
    if (ln.toggle) {
      const cb = h('input', { type: 'checkbox', checked: state[ln.toggle] ? '' : null, title: 'Switch this line on or off', onchange: () => { state[ln.toggle] = cb.checked; row.classList.toggle('off', !cb.checked); sfx.tick(); onChange(state, ln.toggle); } });
      gutter.append(cb);
      row.classList.toggle('off', !state[ln.toggle]);
    }
    rows.push(row);
    panel.append(row);
  });
  const legend = h('div', { class: 'cp-legend' }, h('span', { html: '<i></i>a value you can change' }),
    spec.lines.some((l) => l.toggle) ? h('span', {}, '☑ a line you can switch off') : null);
  return { el: h('div', { style: 'display:flex;flex-direction:column;gap:8px;min-height:0' }, panel, legend, note), state, note,
    mark: (i) => rows.forEach((r, j) => r.classList.toggle('on', j === i)), say: (html) => { note.innerHTML = html; } };
}
