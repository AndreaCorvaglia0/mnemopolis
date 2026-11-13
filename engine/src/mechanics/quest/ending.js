// The ending card: an HTML page like the others, shown once when the League is won (and again from the
// Journey tab). The course title, the big idea, what the learner can do now (the course goals), the
// numbers (questions, accuracy, sure-and-right from the confidence bets, time played), how many things
// in town are still a question mark (a count, never a list), and the way on.
// Resolves with 'back' (or 'next' after the link to the next town was followed).
import { overlay, h } from '../../lab/shell.js';
import { COURSE, PLACES } from '../../data/content.js';
import { DATA, WORLD } from '../../course/_data.js';
import { state } from '../../systems/state.js';
import { LIFE } from '../config.js';
import { lifePlan } from '../active.js';
import { Q_WORDS, tr, fill, playedText } from './strings.js';
import { Q } from './active.js';

const W = Q_WORDS.card;
const CSS = `
.qe-body{flex:1;overflow:auto;padding:28px 18px 40px;background:radial-gradient(ellipse at 50% 0,#2a2412 0,transparent 60%)}
.qe{max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:18px;text-align:center}
.qe-k{margin:0;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.qe h2{margin:0;font-size:30px;line-height:1.2;color:#fff;text-wrap:balance}
.qe-big{margin:0;padding:16px 18px;border-radius:14px;background:#1c1a12;border:1px solid #4d4220;color:#ece3c6;font-size:18px;line-height:1.5;text-wrap:balance}
.qe-sec{text-align:left;padding:14px 18px;border-radius:14px;background:var(--panel);border:1px solid var(--line)}
.qe-sec h3{margin:0 0 8px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.qe-sec ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:16px;line-height:1.45}
.qe-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}
.qe-n{padding:10px;border-radius:12px;background:#0e1219;border:1px solid var(--line)}
.qe-n b{display:block;font-size:26px;color:var(--gold)}.qe-n span{font-size:14px;color:var(--muted)}
.qe-p{margin:10px 0 0;font-size:16px;color:var(--text)}
.qe-left{margin:0;font-size:16px;color:#c9cfdd;font-style:italic}
.qe-go{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;position:sticky;bottom:-40px;padding:14px 0 16px;background:linear-gradient(#0d101600,var(--bg) 35%)}
.qe-go a,.qe-go button{display:inline-flex;align-items:center;min-height:48px;padding:0 22px;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;text-decoration:none}
.qe-back{background:var(--acc);color:var(--acc-ink);border:0}
.qe-next{background:none;border:1px solid var(--gold);color:var(--gold) !important}
`;
let styled = false;

// the numbers of the card, from the save (pure: tests call it with any state)
export function endingNumbers(s = state, places = PLACES, secrets = null) {
  const qs = Object.values(s.q || {}), seen = qs.reduce((n, q) => n + (q.seen || 0), 0), right = qs.reduce((n, q) => n + (q.right || 0), 0);
  const [cr, ct] = s.bets?.[3] || [0, 0];
  const housesLeft = places.filter((p) => !s.visited?.[p.id]).length;
  const secretsLeft = secrets ? secrets.filter((x) => !s.life?.found?.[x.id]).length : 0;
  return { answered: seen, right, accuracy: seen ? Math.round((100 * right) / seen) : 0, certain: [cr, ct], played: s.played || 0, left: housesLeft + secretsLeft };
}

// What the card claims the player can now do: the course goals that the path taught. A goal is a
// string (always shown) or { "text", "concepts": [ids] } (course.json): shown when every concept it
// names is core (the League proved it) or was finished by the player (lab done, or its badge).
// quest: questOf(...) of the course. Pure.
export function goalsShown(goals = [], s = state, quest = Q) {
  const ok = (id) => { const p = quest.byId[id]; if (!p) return true; if (quest.core.includes(p)) return true; const r = quest.placeProgress(p, s); return r.won || (r.visited && r.n >= r.m); };
  return goals.map((g) => (typeof g === 'string' ? { text: g } : g)).filter((g) => g?.text && (g.concepts || []).every(ok)).map((g) => g.text);
}

export function openEnding() {
  if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; }
  const { root, close } = overlay(COURSE.title, '');
  const secrets = LIFE.secrets ? lifePlan().secrets.filter((x) => x.kind !== 'sealed') : null;
  const n = endingNumbers(state, PLACES, secrets), next = WORLD?.next, goals = goalsShown(DATA.goals);
  const nums = [h('div', { class: 'qe-n' }, h('b', {}, String(n.answered)), h('span', {}, tr(W.answered)))];
  if (n.answered) nums.push(h('div', { class: 'qe-n' }, h('b', {}, `${n.accuracy}%`), h('span', {}, tr(W.accuracy))));
  if (n.played >= 60) nums.push(h('div', { class: 'qe-n' }, h('b', {}, playedText(n.played)), h('span', {}, tr(W.time))));
  const back = h('button', { type: 'button', class: 'qe-back' }, tr(W.back));
  const go = [back];
  if (next?.url && next?.title) go.push(h('a', { class: 'qe-next', href: next.url, target: '_blank', rel: 'noopener' }, fill(tr(W.on), { title: next.title })));
  const card = h('div', { class: 'qe' },
    h('p', { class: 'qe-k' }, tr(W.title)),
    h('h2', {}, COURSE.title),
    h('div', { class: 'qe-sec', style: 'text-align:center;background:#1c1a12;border-color:#4d4220' }, h('h3', {}, tr(W.big)), h('p', { class: 'qe-big', style: 'padding:0;border:0' }, COURSE.bigIdea)),
    goals.length ? h('div', { class: 'qe-sec' }, h('h3', {}, tr(W.can)), h('ul', {}, goals.map((g) => h('li', {}, g)))) : null,
    h('div', { class: 'qe-sec' }, h('h3', {}, tr(W.numbers)), h('div', { class: 'qe-nums' }, nums),
      n.certain[1] ? h('p', { class: 'qe-p' }, fill(tr(W.sure), { r: n.certain[0], t: n.certain[1] })) : null),
    h('p', { class: 'qe-left' }, n.left ? fill(tr(W.left), { n: n.left }) : tr(W.leftNone)),
    h('div', { class: 'qe-go' }, go));
  const body = h('div', { class: 'qe-body', tabindex: '-1' }, card);
  root.append(body);
  body.focus();
  root.dataset.ready = '1';
  return new Promise((resolve) => {
    const done = (v) => { window.removeEventListener('keydown', key, true); root.remove(); resolve(v); };
    const key = (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); done('back'); } };
    window.addEventListener('keydown', key, true);
    back.onclick = () => done('back');
    close.onclick = () => done('back');
    go[1]?.addEventListener('click', () => done('next'));
  });
}
