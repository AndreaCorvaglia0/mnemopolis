// Reading walls: one scrollable page per house. Every page has the same frame, built from the
// course database, so the learner always knows where to look:
//   concept and idea -> "think of it as" (the anchor) -> the author's sections (course.json)
//   -> "where you meet it" (the application)
//   -> "explain it yourself" -> "remember" (the 1 to 3 facts the review meadows will ask again).
import { w } from '../data/words.js';
import { overlay, h, listen, listenKey, stopVoice, speak, script, VOICE, isOn } from './shell.js';
import { PLACE } from '../data/content.js';
import { ANIMS } from '../course/_active.js';

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const ANCHOR = w('page.anchor'), THINK = ANCHOR.analogy;

// the author's sections, from course.json
function sections(p) {
  return (p.page || []).map((s) => `<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${s.figure?.kind === 'animation' ? `<figure><canvas data-anim="${esc(s.figure.ref)}" width="720" height="400"></canvas><figcaption>${esc(s.figure.caption)}</figcaption></figure>` : ''}`).join('');
}

function frame(p, body) {
  const anchor = p.anchor ? `<p class="hb-key"><b>${ANCHOR[p.anchor.type] || THINK}:</b> ${esc(p.anchor.text)}${p.anchor.limits ? `<br><span style="color:#8b93a7">${w('page.stops')}: ${esc(p.anchor.limits)}</span>` : ''}</p>` : '';
  const use = p.application ? `<h3>${w('page.meet')}</h3><p>${esc(p.application)}</p>` : '';
  const explain = p.explain ? `<h3>${w('page.explain')}</h3><p>${esc(p.explain.q)}</p><details class="hb-det"><summary>${w('page.sayFirst')}</summary><p>${esc(p.explain.a)}</p></details>` : '';
  const remember = p.remember?.length ? `<h3>${w('page.remember')}</h3><ul class="hb-rem">${p.remember.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : '';
  const more = p.further?.length ? `<h3>${w('page.further')}</h3><ul>${p.further.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener" style="color:#4fd1c5">${esc(f.title)}</a>: ${esc(f.why)}</li>`).join('')}</ul>` : '';
  return `<div class="hb-num">${p.order} · ${esc(p.district.name)}</div><h2>${esc(p.concept)}</h2><p class="lead">${esc(p.idea)}</p>${anchor}${body || ''}${use}${explain}${remember}${more}`;
}

// What Listen reads: the page in order, without the hidden answer of "explain it yourself" and
// without the links.
function spoken(p) {
  if (!p) return '';
  return script([p.concept, p.idea, p.anchor && `${ANCHOR[p.anchor.type] || THINK}: ${p.anchor.text}`, p.anchor?.limits && `${w('page.stops')}: ${p.anchor.limits}`,
    ...(p.page || []).flatMap((x) => [x.title, x.text]), p.application && w('page.meet'), p.application,
    p.explain && w('page.explain'), p.explain?.q, p.remember?.length && w('page.remember'), ...(p.remember || [])]);
}

// The article of a place (or of a free page): used by the reading wall and by the lab's theory
// drawer. `start(scroller)` runs the page's animations while they are visible; it returns `stop`.
export function readingArticle(id) {
  const p = PLACE[id], page = { html: p ? sections(p) : '' };
  const art = h('article', { html: p ? frame(p, page.html) : page.html || '' });
  const start = (scroller) => {
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
    return () => { alive = false; };
  };
  return { p, art, start, spoken: () => spoken(p) };
}

// Opens the page of a place (or a free page from pages.js by id). Resolves with 'lab' if the reader asks for the lab.
export function openReading(id, anchor = null) {
  const { p, art, start } = readingArticle(id);
  const { root, close } = overlay(p ? p.name : '', p ? w('page.wall') : w('page.deep'), p ? () => spoken(p) : null);
  const hasLab = p && p.kind !== 'museum';
  const go = h('button', { class: 'hb-go' }, !p ? w('page.back') : p.kind === 'workshop' ? w('page.machines') : w('page.tryLab'));
  if (hasLab || !p) art.append(go);
  const scroller = h('div', { class: 'hb-page', tabindex: '0' }, art);
  root.append(scroller);
  scroller.focus();
  if (anchor) requestAnimationFrame(() => art.querySelector(`#sec-${anchor}`)?.scrollIntoView());
  const stop = start(scroller);
  root.dataset.ready = '1';
  if (p && VOICE.auto && isOn()) speak(spoken(p));
  return new Promise((resolve) => {
    const done = (v) => { stop(); stopVoice(); window.removeEventListener('keydown', key, true); root.remove(); resolve(v); };
    const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); done(); } else if (p && listenKey(e)) { e.preventDefault(); listen(() => spoken(p)); } };
    window.addEventListener('keydown', key, true);
    close.onclick = () => done();
    go.onclick = () => done('lab');
  });
}
