// The look of the duel screen (dl-*). Same tokens as the lab frame (lab/style.js): dark and calm,
// teal for the one primary action, gold for the learner's own choice; text at least 16 px,
// targets at least 44 px. Phone held upright first; wider screens get the same column, larger.
export const CSS = `
.dl{--bg:#0d1016;--panel:#131821;--card:#192030;--line:#263041;--text:#e8eaf0;--muted:#b0b8c9;--acc:#4fd1c5;--acc-ink:#04201d;--gold:#ffcf5a;--ok:#7ddc8a;--bad:#ff8a7a;--conv:#e9a23b;--comp:#4fd1c5;
  position:fixed;inset:0;z-index:20;background:radial-gradient(ellipse at 50% 0%,#1b2236 0%,var(--bg) 62%);color:var(--text);font:17px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column}
.dl *{box-sizing:border-box}
.dl button{font:inherit;color:inherit}
.dl :focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.dl [hidden]{display:none !important}
.dl-top{flex:none;display:flex;align-items:center;gap:10px;height:52px;padding:0 6px 0 16px;border-bottom:1px solid var(--line);background:var(--panel)}
.dl-title{flex:1;min-width:0;margin:0;font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dl-title span{color:var(--muted);font-weight:400}
.dl-x{display:inline-flex;align-items:center;gap:6px;height:44px;min-width:44px;padding:0 12px;border-radius:10px;background:none;border:1px solid var(--line);cursor:pointer;font-size:16px;white-space:nowrap}
.dl-x:hover{background:#1e2633}
.dl-scroll{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch}
.dl-col{max-width:760px;margin:0 auto;padding:10px 14px 16px}
/* the two fighters */
.dl-arena{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:6px;padding:28px 2px 0}
.dl-f{display:flex;flex-direction:column;gap:4px;min-width:0;position:relative}
.dl-f.me{align-items:flex-start}.dl-f.them{align-items:flex-end}
.dl-body{display:flex;align-items:flex-end;gap:10px}
.dl-f.them .dl-body{flex-direction:row-reverse}
.dl-sprite{image-rendering:pixelated;display:block;width:48px;height:72px;flex:none}
.dl-who{display:flex;flex-direction:column;min-width:0}
.dl-f.them .dl-who{align-items:flex-end;text-align:right}
.dl-name{font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.dl-label{font-size:15px;color:var(--muted)}
.dl-bar{position:relative;width:100%;height:16px;border-radius:8px;background:#232c3b;overflow:hidden;box-shadow:inset 0 0 0 1px #000a}
.dl-fill{position:absolute;top:0;bottom:0;left:0;border-radius:8px;transition:width .45s cubic-bezier(.2,.8,.2,1)}
.dl-f.me .dl-fill{background:var(--comp)}
.dl-f.them .dl-fill{left:auto;right:0;background:var(--conv)}
.dl-ticks{position:absolute;inset:0;pointer-events:none}
.dl-ticks i{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:#0d1016aa}
.dl-num{font-size:15px;color:var(--muted);font-variant-numeric:tabular-nums}
.dl-vs{align-self:center;display:flex;flex-direction:column;align-items:center;gap:0;padding:0 4px;color:var(--muted);font-size:15px;white-space:nowrap}
.dl-vs b{font-size:18px;color:var(--text)}
.dl-pop{position:absolute;top:-28px;z-index:2;padding:0 6px;border-radius:6px;background:#0d1016d9;font-weight:800;font-size:18px;color:var(--gold);text-shadow:0 2px 0 #000;pointer-events:none;animation:dlpop 1.1s ease-out forwards;white-space:nowrap}
.dl-f.me .dl-pop{left:0}.dl-f.them .dl-pop{right:0}
.dl-pop.bad{color:var(--bad)}
@keyframes dlpop{0%{transform:translateY(8px) scale(.7);opacity:0}20%{transform:translateY(0) scale(1.1);opacity:1}80%{opacity:1}100%{transform:translateY(-16px);opacity:0}}
.dl-f.beaten .dl-sprite{transform:rotate(-10deg) translateY(4px);filter:saturate(.5) brightness(.85);transition:transform .5s,filter .5s}
.dl-f.me.beaten .dl-sprite{transform:rotate(10deg) translateY(4px)}
.dl-shake{animation:dlshake .42s ease-in-out}
@keyframes dlshake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
/* what the opponent says */
.dl-say{position:relative;margin:10px 0 0;padding:9px 14px;border-radius:12px;background:#f3eedf;color:#22202e;font-size:16px;line-height:1.35;min-height:44px}
.dl-say::before{content:'';position:absolute;top:-9px;right:34px;border:9px solid transparent;border-top:0;border-bottom-color:#f3eedf}
.dl-say b{font-weight:700}
.dl-say.in{animation:dlin .25s ease-out}
@keyframes dlin{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
/* the question */
.dl-card{margin-top:12px;padding:14px 14px 12px;border-radius:14px;background:var(--card);border:1px solid var(--line)}
.dl-meta{display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:15px;color:var(--muted)}
.dl-chip{padding:1px 9px;border-radius:6px;background:#2a3550;color:#dfe5f3;font-size:15px}
.dl-q{margin:0 0 10px;font-size:20px;line-height:1.35;font-weight:650;color:#fff}
.dl-opts{display:flex;flex-direction:column;gap:8px}
.dl-o{display:flex;align-items:center;gap:12px;min-height:52px;padding:8px 12px;border-radius:10px;background:#141a26;border:2px solid var(--line);text-align:left;cursor:pointer;font-size:17px}
.dl-o:hover:not(:disabled){border-color:#5b6880;background:#1a2231}
.dl-o .k{flex:none;width:30px;height:30px;border-radius:7px;display:grid;place-items:center;background:#e9e2c9;color:#1b1a2b;font-weight:800;font-size:16px}
.dl-o:disabled{cursor:default}
.dl-o.ok{border-color:var(--ok);background:#173a2a}.dl-o.ok .k{background:var(--ok)}
.dl-o.no{border-color:var(--bad);background:#3e1c22}.dl-o.no .k{background:var(--bad)}
.dl-help{margin:10px 0 0;font-size:15px;color:var(--muted);text-align:center}
/* what was learned from the answer */
.dl-fb{margin-top:12px;padding:12px 14px;border-radius:12px;border:2px solid var(--line);background:#141a26}
.dl-fb.ok{border-color:#2f7a4f}.dl-fb.no{border-color:#8a3d43}
.dl-fb h3{margin:0 0 6px;font-size:18px;display:flex;align-items:baseline;gap:10px}
.dl-fb h3 .c{margin-left:auto;font-size:15px;color:var(--gold);font-weight:600;white-space:nowrap}
.dl-fb p{margin:6px 0 0}
.dl-fb .lab{color:var(--muted)}
.dl-fb .trap{color:#ffd0c8}
.dl-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.dl-b{flex:1 1 140px;min-height:48px;padding:0 16px;border-radius:10px;border:1px solid var(--line);background:#1a2231;cursor:pointer;font-weight:600;font-size:17px}
.dl-b:hover{border-color:#5b6880}
.dl-b.go{background:var(--acc);border-color:var(--acc);color:var(--acc-ink)}
.dl-b.go:hover{filter:brightness(1.08)}
/* the end */
.dl-end{margin-top:12px;padding:16px;border-radius:14px;background:var(--card);border:1px solid var(--line);text-align:center}
.dl-end h2{margin:0 0 4px;font-size:24px}
.dl-end .sub{color:var(--muted);margin:0}
.dl-prizes{display:flex;justify-content:center;gap:22px;margin:14px 0 4px}
.dl-prize{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:15px;color:var(--muted)}
.dl-prize svg{width:56px;height:56px}
.dl-prize.new svg{animation:dlprize .7s cubic-bezier(.2,1.6,.4,1) both}
@keyframes dlprize{from{transform:scale(.2) rotate(-30deg);opacity:0}to{transform:none;opacity:1}}
.dl-advice{text-align:left;margin:12px 0 0;padding:10px 12px;border-radius:10px;background:#141a26;border:1px solid var(--line)}
.dl-advice ul{margin:6px 0 0;padding-left:20px}
.dl-advice li{margin:2px 0}
.dl-keyhint{display:none}
@media (pointer:fine){.dl-keyhint{display:block}}
/* larger screens: bigger fighters, same reading column */
@media (min-width:700px) and (min-height:600px){
  .dl-sprite{width:80px;height:120px}
  .dl-q{font-size:22px}
  .dl-col{padding-top:16px}
}
/* the story: remembering. Memory fills (a warm lamp colour) from the owner's side; clarity is
   the player's; the keeper's room is darker, lit by a single lamp */
.dl.story{--conv:#ffd27a;--comp:#9fd8ff;background:radial-gradient(ellipse at 50% 0%,#202536 0%,#0b0d14 65%)}
.dl.story .dl-f.them .dl-fill{box-shadow:0 0 12px #ffd27a88}
.dl.story .dl-fb.no .trap{color:#ffe0b0;font-style:italic}
.dl.dark{background:radial-gradient(ellipse at 50% 10%,#2a2416 0%,#07080c 55%)}
.dl.dark .dl-top{background:#0a0b10}
.dl.dark .dl-card,.dl.dark .dl-end{background:#11131b}
@media (prefers-reduced-motion:reduce){.dl *,.dl *::before{animation:none !important;transition:none !important}}
`;
