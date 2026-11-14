// The mini-games' frame: a full-screen page in the language of the lab frame and the close-ups,
// phone first. Title, 3-2-1, rounds with immediate feedback and a sound, a timer or a counter where
// the kind uses one, the result (score, best, what it practises, coins and experience), Again and
// Done. Esc or Step back leaves at any time and costs nothing.
//   openGame(game, { state, lang, save, experience, onEnd }) -> Promise<{ played, score, coins, xp, best }>
// A kind (kinds/*.js) or a course's custom game mounts on the context `g` described in
// references/10-games.md.
import { h } from '../../lab/shell.js';
import { uiSound } from '../../systems/sound/index.js';
import { sound } from '../../systems/sound/lab.js';
import { soundMuted } from '../../systems/sound/index.js';
import { G_WORDS as W } from './strings.js';
import { play as newPlay, recordPlay, levelOf } from './scoring.js';
import { shuffle as shuf } from './gen.js';
import { dayKey } from '../experience/model.js';

const CSS = `
.gm{position:fixed;inset:0;z-index:22;background:radial-gradient(120% 90% at 50% 0%,#1a1626 0%,#0b0910 70%);color:#f1ecd9;display:flex;flex-direction:column;font:17px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden}
.gm *{box-sizing:border-box}.gm [hidden]{display:none !important}.gm button{font:inherit;color:inherit}
.gm :focus-visible{outline:3px solid #ffcf5a;outline-offset:2px}
.gm-top{display:flex;align-items:center;gap:12px;min-height:52px;padding:4px 8px 4px 16px;background:#0f0d16;border-bottom:1px solid #2a2436;flex:none}
.gm-top h1{flex:1;min-width:0;margin:0;font-size:17px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gm-top h1 span{color:#a9a2b8;font-weight:400}
.gm-back{min-height:44px;padding:0 14px;border-radius:10px;background:none;border:1px solid #3a3348;cursor:pointer;white-space:nowrap}
.gm-back:hover{background:#1c1826}
.gm-hud{display:flex;align-items:center;gap:12px;padding:10px 16px 0;max-width:620px;width:100%;margin:0 auto;flex:none;min-height:40px}
.gm-dots{display:flex;gap:5px;flex:1;flex-wrap:wrap}
.gm-dots i{width:12px;height:12px;border-radius:50%;background:#2c2638;border:1px solid #453d55}
.gm-dots i.r{background:#4fd1c5;border-color:#4fd1c5}.gm-dots i.w{background:#6b5f7d;border-color:#6b5f7d}.gm-dots i.c{border:2px solid #ffcf5a}
.gm-score{font-weight:700;color:#ffcf5a;font-variant-numeric:tabular-nums;white-space:nowrap}
.gm-streak{color:#4fd1c5;font-size:14px;white-space:nowrap}
.gm-timer{height:6px;max-width:620px;width:calc(100% - 32px);margin:8px auto 0;border-radius:3px;background:#2a2436;overflow:hidden;flex:none}
.gm-timer b{display:block;height:100%;width:100%;background:#4fd1c5;transform-origin:0 50%}
.gm-timer b.low{background:#e0a458}
.gm-main{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 16px 8px}
.gm-ask{font-size:21px;font-weight:600;text-align:center;margin:6px 0 12px;max-width:600px}
.gm-stage{width:100%;max-width:620px;display:flex;flex-direction:column;align-items:center;gap:14px}
.gm-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;width:100%}
.gm-btn{min-height:48px;padding:0 18px;border-radius:12px;border:1px solid #4a4258;background:linear-gradient(#2a2433,#1d1826);cursor:pointer;box-shadow:0 3px 0 #0a080e;font-weight:600}
.gm-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #0a080e}
.gm-btn.big{min-height:64px;min-width:120px;font-size:20px}
.gm-btn.primary{background:#4fd1c5;color:#04201d;border-color:#4fd1c5;box-shadow:0 3px 0 #1f6e66}
.gm-btn:disabled{opacity:.45;cursor:default}
.gm-pick{position:relative;flex:1 1 140px;max-width:260px;min-height:150px;border-radius:16px;border:2px solid #4a4258;background:#17131f;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:10px;box-shadow:0 4px 0 #0a080e;transition:transform .08s}
.gm-pick:hover{border-color:#7a6f90}.gm-pick:active{transform:translateY(2px)}
.gm-pick .k{position:absolute;left:8px;top:6px;font-size:13px;color:#8d85a0}
.gm-pick.yes{border-color:#4fd1c5;box-shadow:0 0 0 3px rgba(79,209,197,.35)}.gm-pick.no{border-color:#b98a8a;opacity:.85}
.gm-pick.dim{opacity:.4}
.gm-sw{width:96px;height:96px;border-radius:12px;border:2px solid rgba(255,255,255,.18);box-shadow:inset 0 0 0 2px rgba(0,0,0,.25)}
.gm-txt{font-size:22px;font-weight:600;text-align:center;word-break:break-word}
.gm-snd{display:flex;align-items:center;gap:6px;font-size:18px}
.gm-snd .n{font-size:28px;font-weight:700}
.gm-snd.on{color:#ffcf5a}
.gm-feed{min-height:56px;max-width:620px;width:calc(100% - 32px);margin:0 auto calc(10px + env(safe-area-inset-bottom));padding:10px 14px;border-radius:12px;background:#14111c;border:1px solid #2a2436;text-align:center;flex:none;display:flex;align-items:center;justify-content:center;gap:10px}
.gm-feed.yes{border-color:#2f8c84;background:#0f201f}.gm-feed.no{border-color:#5f4b5b;background:#1b1419}
.gm-feed .pts{color:#ffcf5a;font-weight:700}
.gm-keys{color:#8d85a0;font-size:14px;text-align:center;padding:0 16px 6px;flex:none}
.gm-card{width:100%;max-width:520px;margin:auto;padding:22px 20px;border-radius:18px;background:#14111c;border:1px solid #2e2840;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center}
.gm-card h2{margin:0;font-size:26px}.gm-card p{margin:0;color:#cfc8dc}
.gm-card .gm-big{font-size:52px;font-weight:800;color:#ffcf5a;line-height:1.1}
.gm-card .gold{color:#ffcf5a}.gm-card .teal{color:#4fd1c5}
.gm-count{font-size:120px;font-weight:800;color:#ffcf5a;margin:auto;text-shadow:0 6px 0 rgba(0,0,0,.4)}
.gm-shake{animation:gmShake .32s}
@keyframes gmShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.gm-pop{animation:gmPop .3s}
@keyframes gmPop{0%{transform:scale(.9)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
@media (prefers-reduced-motion: reduce){.gm-shake,.gm-pop{animation:none}.gm-count{transition:none}}
@media (max-width:480px){.gm-pick{min-height:104px;flex-basis:120px}.gm-sw{width:68px;height:68px}.gm-ask{font-size:19px}.gm-count{font-size:96px}}
`;

const pickOne = (a, r) => a[Math.floor(r() * a.length)];
const prng = (seed) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

// opts: { state, lang, save, kinds (kind -> mount), custom (id -> module), experience: () => number, fast }
export function openGame(game, opts) {
  const { state, lang = 'en', save = () => {}, kinds, custom = {}, experience = () => 0 } = opts;
  const t = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] ?? v.en : v);
  const T = (k, vars) => fill(t(W[k]), vars || {});
  const games = ((state.xp ||= {}).games ||= {});
  const saved = games[game.id] || null;
  const rounds = game.rounds || (game.kind === 'match-fast' ? 3 : 8);
  if (!document.getElementById('gm-css')) document.head.append(h('style', { id: 'gm-css' }, CSS));

  return new Promise((resolve) => {
    let cleanups = [], alive = true, onRoundFn = null, p = null, timer = null, busy = false, keyFn = null;
    const rng = prng((Date.now() ^ (game.id.length * 2654435761)) >>> 0);
    const back = h('button', { type: 'button', class: 'gm-back' }, T('back'));
    const title = h('h1', {}, t(game.title));
    const dots = h('div', { class: 'gm-dots', 'aria-hidden': 'true' });
    const scoreEl = h('div', { class: 'gm-score', role: 'status' }), streakEl = h('div', { class: 'gm-streak' });
    const hud = h('div', { class: 'gm-hud' }, dots, streakEl, scoreEl);
    const bar = h('b'), timerEl = h('div', { class: 'gm-timer', hidden: '' }, bar);
    const ask = h('div', { class: 'gm-ask' });
    const stage = h('div', { class: 'gm-stage' });
    const main = h('div', { class: 'gm-main' }, ask, stage);
    const feed = h('div', { class: 'gm-feed', role: 'status', 'aria-live': 'polite' });
    const keys = h('div', { class: 'gm-keys' });
    const root = h('div', { class: 'gm', role: 'dialog', 'aria-label': t(game.title) }, h('div', { class: 'gm-top' }, title, back), hud, timerEl, main, feed, keys);
    document.body.append(root);
    uiSound('open');
    let snd = sound({ onCleanup: (f) => cleanups.push(f) });

    const finish = (res) => {
      if (!alive) return;
      alive = false; stopTimer();
      cleanups.forEach((f) => { try { f(); } catch { /* ignore */ } }); cleanups = [];
      document.removeEventListener('keydown', onKey, true);
      root.remove(); uiSound('close');
      resolve(res);
    };
    back.onclick = () => finish({ played: false });
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish({ played: false }); return; }
      if (keyFn && keyFn(e) === true) { e.preventDefault(); e.stopPropagation(); }
    };
    document.addEventListener('keydown', onKey, true);

    function stopTimer() { if (timer) { cancelAnimationFrame(timer.raf); timer = null; } timerEl.hidden = true; }
    function drawHud() {
      dots.innerHTML = '';
      for (let i = 0; i < rounds; i++) dots.append(h('i', { class: p && i < p.log.length ? (p.log[i].right ? 'r' : 'w') : p && i === p.n ? 'c' : '' }));
      scoreEl.textContent = p ? T('score', { n: p.score }) : '';
      streakEl.textContent = p && p.streak >= 3 ? T('streak', { n: p.streak }) : '';
    }

    // ---- the context of a kind or of a custom game
    const g = {
      stage, data: game.data || {}, lang, t, rounds, game,
      get round() { return p ? p.n + 1 : 0; },
      level: () => (p ? p.level() : 0),
      step: () => (p ? p.stair.step : 0),
      rng, pick: (a) => pickOne(a, rng), shuffle: (a) => shuf(rng, a),
      sound: null, words: T,
      onRound: (fn) => { onRoundFn = fn; },
      onKey: (fn) => { keyFn = fn; },
      ask: (text) => { ask.textContent = text || ''; },
      say: (text, cls = '') => { feed.className = `gm-feed ${cls}`; feed.textContent = text; },
      alive: () => alive,
      onCleanup: (f) => cleanups.push(f),
      timer(seconds, onEnd) {
        stopTimer();
        const t0 = performance.now(), ms = seconds * 1000;
        timerEl.hidden = false;
        const tm = { stop: stopTimer, left: () => Math.max(0, ms - (performance.now() - t0)) / 1000, raf: 0 };
        const tick = () => {
          if (!alive || timer !== tm) return;
          const f = Math.max(0, 1 - (performance.now() - t0) / ms);
          bar.style.transform = `scaleX(${f})`; bar.classList.toggle('low', f < 0.3);
          if (f <= 0) { stopTimer(); uiSound('timeUp'); onEnd?.(); return; }
          tm.raf = requestAnimationFrame(tick);
        };
        timer = tm; tm.raf = requestAnimationFrame(tick);
        return tm;
      },
      // ends the round: feedback, points, then the next round or the result
      answer(right, { said = null, truth = null, why = null, weight = 1, fast = null, timeUp = false } = {}) {
        if (!alive || busy || !p) return;
        busy = true;
        const quick = fast ?? (timer ? timer.left() > 0 && performance.now() - roundStart < 2500 : performance.now() - roundStart < 2500);
        stopTimer();
        const pts = p.result(!!right, { fast: !!right && quick, weight });
        uiSound(right ? (p.streak >= 3 ? 'streak' : 'right') : 'wrong');
        const msg = right ? `${pickOne(t(W.rightMore), rng)}` : timeUp ? (truth ? T('timeUp', { it: truth }) : T('timeUpPlain')) : truth ? T('wrong', { it: T('itWas', { x: truth }) }) : T('wrongPlain');
        feed.className = `gm-feed ${right ? 'yes' : 'no'} gm-pop`;
        feed.innerHTML = '';
        feed.append(h('span', {}, (said != null && !right ? `${T('said', { x: said })} ` : '') + msg + (why ? ` ${why}` : '')));
        if (pts) feed.append(h('span', { class: 'pts' }, T('points', { n: pts })));
        if (!right) stage.classList.add('gm-shake');
        drawHud();
        setTimeout(() => { stage.classList.remove('gm-shake'); }, 340);
        setTimeout(() => { busy = false; if (alive) next(); }, right ? (opts.fast ? 300 : 850) : why ? (opts.fast ? 500 : 2600) : (opts.fast ? 400 : 1500));
      },
    };
    let roundStart = 0;
    const keyHint = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches ? T(game.kind === 'sort-fast' ? 'keysSort' : game.kind === 'estimate' ? 'keysEstimate' : 'keysWhich') : '';
    function next() {
      if (!alive) return;
      if (p.over()) return result();
      drawHud();
      feed.className = 'gm-feed'; feed.textContent = '';
      if (p.n === 0 && keyHint) feed.append(h('span', { class: 'gm-keys' }, keyHint));
      roundStart = performance.now();
      onRoundFn?.(p.n + 1, p.level());
    }

    // ---- screens
    function intro() {
      stage.innerHTML = ''; ask.textContent = ''; hud.hidden = true; feed.hidden = true; keys.textContent = '';
      const best = saved?.best ? T('best', { n: saved.best }) : T('noBest');
      const start = h('button', { type: 'button', class: 'gm-btn big primary' }, T('start'));
      const card = h('div', { class: 'gm-card' }, h('h2', {}, t(game.title)), game.data?.ask ? h('p', {}, t(game.data.ask)) : null, h('p', { class: 'gold' }, best), start);
      stage.append(card);
      start.onclick = () => countdown();
      keyFn = (e) => { if (e.key === 'Enter' || e.key === ' ') { countdown(); return true; } return false; };
      setTimeout(() => start.focus({ preventScroll: true }), 30);
    }
    async function countdown() {
      keyFn = null; stage.innerHTML = '';
      const n = h('div', { class: 'gm-count', 'aria-live': 'assertive' });
      stage.append(n);
      for (const k of ['3', '2', '1']) { if (!alive) return; n.textContent = k; n.classList.remove('gm-pop'); void n.offsetWidth; n.classList.add('gm-pop'); uiSound('count'); await wait(opts.fast ? 120 : 650); }
      if (!alive) return;
      n.textContent = T('go'); uiSound('go'); await wait(opts.fast ? 100 : 400);
      begin();
    }
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    async function begin() {
      if (!alive) return;
      stage.innerHTML = ''; hud.hidden = false; feed.hidden = false; feed.textContent = '';
      snd.stopAll?.();
      snd = sound({ onCleanup: (f) => cleanups.push(f) });
      g.sound = snd;
      p = newPlay(rounds, saved);
      onRoundFn = null; keyFn = null;
      const mount = game.kind === 'custom' ? custom[game.id]?.mount || custom[game.id]?.default?.mount : kinds[game.kind];
      if (!mount) { g.say(`No code for ${game.id}`); return; }
      try { await mount(g); } catch (e) { console.error(e); g.say(String(e.message || e)); return; }
      if (!alive) return;
      next();
    }
    function result() {
      stopTimer(); keyFn = null;
      stage.innerHTML = ''; ask.textContent = ''; hud.hidden = true;
      feed.hidden = true;
      const before = experience();
      const r = recordPlay(games, game.id, { score: p.score, step: p.stair.step }, dayKey(Date.now()));
      state.insight = (state.insight || 0) + r.coins;
      save();
      const xp = Math.max(0, experience() - before);
      uiSound('result');
      const again = h('button', { type: 'button', class: 'gm-btn big' }, T('again')), done = h('button', { type: 'button', class: 'gm-btn big primary' }, T('done'));
      const card = h('div', { class: 'gm-card gm-res gm-pop' },
        h('p', {}, T('result')),
        h('div', { class: 'gm-big' }, String(p.score)),
        h('p', {}, T('rightOf', { n: p.right, m: p.rounds })),
        h('p', { class: r.best ? 'teal' : 'gold' }, r.best ? T('newBest') : T('best', { n: games[game.id].best })),
        game.learn ? h('p', {}, t(game.learn)) : null,
        h('p', { class: 'gold' }, T('earned', { c: r.coins, x: xp })),
        games[game.id].today > 3 ? h('p', {}, T('half')) : null,
        h('div', { class: 'gm-row' }, again, done));
      stage.append(card);
      const res = { played: true, score: p.score, right: p.right, coins: r.coins, xp, best: r.best, level: levelOf(p.stair.step) };
      root.__result = res;
      again.onclick = () => { p = null; countdown(); };
      done.onclick = () => finish(res);
      keyFn = (e) => { if (e.key === 'Enter') { finish(res); return true; } return false; };
      setTimeout(() => done.focus({ preventScroll: true }), 30);
      opts.onResult?.(res);
    }
    root.__game = { g, get play() { return p; }, finish: () => finish({ played: false }), start: () => countdown(), bot: (right = true) => (busy ? null : g.bot?.(right)), get busy() { return busy; }, get phase() { return !alive ? 'closed' : root.querySelector('.gm-res') ? 'result' : p ? 'round' : root.querySelector('.gm-count') ? 'count' : 'intro'; } };
    if (game.kind !== 'custom' && soundUsed(game) && soundMuted()) keys.textContent = T('soundOff');
    intro();
  });
}

export function soundUsed(game) { return JSON.stringify(game.data || {}).includes('"sound"') || game.data?.make?.kind === 'tone'; }
