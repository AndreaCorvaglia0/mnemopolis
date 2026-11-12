// Reading walls: one scrollable page per house. Every page has the same frame, built from the
// course database, so the learner always knows where to look:
//   concept and idea -> "think of it as" (the anchor) -> the author's sections (course.json)
//   -> "where you meet it" (the application)
//   -> "explain it yourself" -> "remember" (the 1 to 3 facts the review meadows will ask again).
import { overlay, h } from './shell.js';
import { PLACE } from '../data/content.js';
import { ANIMS } from '../course/_active.js';

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const ANCHOR = { analogy: 'Think of it as', metaphor: 'Think of it as', example: 'Picture this', contrast: 'Compare' };

// the author's sections, from course.json
function sections(p) {
  return (p.page || []).map((s) => `<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${s.figure?.kind === 'animation' ? `<figure><canvas data-anim="${esc(s.figure.ref)}" width="720" height="400"></canvas><figcaption>${esc(s.figure.caption)}</figcaption></figure>` : ''}`).join('');
}

function frame(p, body) {
  const anchor = p.anchor ? `<p class="hb-key"><b>${ANCHOR[p.anchor.type] || 'Think of it as'}:</b> ${esc(p.anchor.text)}${p.anchor.limits ? `<br><span style="color:#8b93a7">Where it stops working: ${esc(p.anchor.limits)}</span>` : ''}</p>` : '';
  const use = p.application ? `<h3>Where you meet it</h3><p>${esc(p.application)}</p>` : '';
  const explain = p.explain ? `<h3>Explain it yourself</h3><p>${esc(p.explain.q)}</p><details class="hb-det"><summary>Say your answer out loud first, then compare</summary><p>${esc(p.explain.a)}</p></details>` : '';
  const remember = p.remember?.length ? `<h3>Remember</h3><ul class="hb-rem">${p.remember.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : '';
  const more = p.further?.length ? `<h3>Go further</h3><ul>${p.further.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener" style="color:#4fd1c5">${esc(f.title)}</a>: ${esc(f.why)}</li>`).join('')}</ul>` : '';
  return `<div class="hb-num">${p.order} · ${esc(p.district.name)}</div><h2>${esc(p.concept)}</h2><p class="lead">${esc(p.idea)}</p>${anchor}${body || ''}${use}${explain}${remember}${more}`;
}

// Opens the page of a place (or a free page from pages.js by id). Resolves with 'lab' if the reader asks for the lab.
export function openReading(id, anchor = null) {
  const p = PLACE[id], page = { html: p ? sections(p) : '' };
  const { root, close } = overlay(p ? p.name : page.title || '', p ? 'Reading wall' : page.sub || 'Deep dive');
  const hasLab = p && p.kind !== 'museum';
  const go = h('button', { class: 'hb-go' }, !p ? 'Back →' : p.kind === 'workshop' ? 'Go to the machines →' : 'Try it in the lab →');
  const art = h('article', { html: p ? frame(p, page.html) : page.html || '' });
  if (hasLab || !p) art.append(go);
  const scroller = h('div', { class: 'hb-page', tabindex: '0' }, art);
  root.append(scroller);
  scroller.focus();
  if (anchor) requestAnimationFrame(() => art.querySelector(`#sec-${anchor}`)?.scrollIntoView());
  let alive = true;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // <canvas data-anim="name" width="720" height="400"> is drawn by ANIMS[name](g, seconds)
  art.querySelectorAll('canvas[data-anim]').forEach((cv) => {
    const draw = ANIMS[cv.dataset.anim], g = cv.getContext('2d');
    if (!draw) return;
    let visible = false, last = -1;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { root: scroller }).observe(cv);
    const tick = (ms) => {
      if (!alive) return;
      const t = still ? 2.2 : ms / 1000;
      if ((visible || last < 0) && t - last > 0.05) { last = t; g.clearRect(0, 0, cv.width, cv.height); draw(g, t, cv); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  root.dataset.ready = '1';
  return new Promise((resolve) => {
    const done = (v) => { alive = false; window.removeEventListener('keydown', key, true); root.remove(); resolve(v); };
    const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); done(); } };
    window.addEventListener('keydown', key, true);
    close.onclick = () => done();
    go.onclick = () => done('lab');
  });
}
