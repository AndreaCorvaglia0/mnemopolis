// Styles of the pages on top of the game: the lab frame (lx-*), the controls stations use
// (lab-*), and the reading wall and map header (hb-*). One dark, calm look; the accent colour
// (teal) is kept for the one primary action and the current position.
export const CSS = `
.hb-over{--bg:#0d1016;--stage:#080a0f;--panel:#131821;--card:#192030;--line:#263041;--text:#e8eaf0;--muted:#b0b8c9;--acc:#4fd1c5;--acc-ink:#04201d;--gold:#ffcf5a;--ok:#7ddc8a;
  position:fixed;inset:0;z-index:20;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column}
.hb-over *{box-sizing:border-box}
.hb-over button{font:inherit;color:inherit}
.hb-over :focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.hb-over svg{flex:none}
.hb-over [hidden]{display:none !important}

/* ---- header used by the reading wall and the map ---- */
.hb-top{display:flex;align-items:center;gap:18px;padding:6px 8px 6px 16px;min-height:56px;border-bottom:1px solid var(--line);background:var(--panel)}
.hb-top h1{font-size:17px;margin:0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.hb-top h1 span{color:var(--muted);font-weight:400}
.hb-tabs{display:none}
.hb-say{display:inline-flex;align-items:center;gap:8px;height:44px;background:none;border:1px solid var(--line);border-radius:10px;padding:0 14px;font-size:16px;cursor:pointer;white-space:nowrap;flex:none}
.hb-say::before{content:'';width:0;height:0;border-left:9px solid var(--acc);border-top:6px solid transparent;border-bottom:6px solid transparent}
.hb-say:hover{border-color:var(--acc)}
.hb-say[aria-pressed=true]{background:var(--acc);color:var(--acc-ink);border-color:var(--acc);font-weight:600}
.hb-say[aria-pressed=true]::before{width:10px;height:10px;border:0;background:var(--acc-ink);border-radius:2px;animation:hbpulse 1s ease-in-out infinite alternate}
@keyframes hbpulse{from{opacity:1}to{opacity:.35}}
.lx-say[aria-pressed=true]{background:var(--acc);color:var(--acc-ink);border-color:var(--acc);font-weight:600}
.hb-close,.lx-x{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:44px;height:44px;padding:0 12px;background:none;border:1px solid transparent;border-radius:10px;cursor:pointer;white-space:nowrap;flex:none}
.hb-close:hover,.lx-x:hover{background:#1e2633;border-color:var(--line)}

/* ---- the lab frame ---- */
.lx{--pw:380px}
.lx.wide{--pw:540px}
@media (max-width:1100px),(max-height:520px){.lx{--pw:340px}.lx.wide{--pw:440px}.lx-scroll{padding:16px}}
.lx.collapsed{--pw:76px}
.lx.theory:not(.stack){--pw:min(560px,44vw)}
.lx-top{display:flex;align-items:center;gap:10px;height:56px;padding:0 6px 0 16px;border-bottom:1px solid var(--line);background:var(--panel);flex:none}
.lx-name{flex:0 1 auto;min-width:0;max-width:30ch;margin:0 4px 0 0;padding-right:14px;border-right:1px solid var(--line);font-size:16px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:default}
@media (max-width:1000px){.lx-name{display:none}}
.lx-steps{flex:1 1 0;min-width:0;display:flex;align-items:center;overflow:hidden}
.lx-link{flex:0 0 14px;height:2px;border-radius:1px;background:#3a4659}
.lx-link.done{background:var(--ok)}
.lx-step{flex:0 1 auto;min-width:44px;height:44px;display:flex;align-items:center;gap:8px;padding:0 12px 0 9px;border-radius:22px;background:none;border:1px solid transparent;color:var(--muted);font-size:16px;cursor:pointer}
.lx-step .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lx-step .m{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;border:2px solid #5b6880;font-weight:700;font-size:14px;line-height:1}
.lx-step:hover{background:#1b2230;border-color:#3a4659;color:var(--text)}
.lx-step:hover .m{border-color:var(--text)}
.lx-step.done .m{background:var(--ok);border-color:var(--ok);color:#0b1a10}
.lx-step.cur{flex:0 0 auto;max-width:min(380px,60%);background:#1e2836;border-color:#2f3b4f;color:#fff;font-weight:600}
.lx-step.cur .m{border-color:var(--acc);color:var(--acc)}
.lx-step.cur.done .m{color:#0b1a10}
.lx-steps.many .lx-step:not(.cur){padding:0 8px}.lx-steps.many .lx-step:not(.cur) .t{display:none}
.lx-tabtip{position:fixed;z-index:40;padding:6px 12px;border-radius:8px;background:#05070be8;border:1px solid #3a4659;color:#fff;font-size:16px;white-space:nowrap;pointer-events:none}
.lx-tools{display:flex;align-items:center;gap:4px;flex:none}
.lx-btn{display:inline-flex;align-items:center;gap:8px;height:44px;min-width:44px;padding:0 14px;border-radius:10px;background:none;border:1px solid var(--line);cursor:pointer;font-size:16px;white-space:nowrap}
.lx-btn:hover{background:#1e2633;border-color:#3a4659}
.lx-btn[aria-pressed=true]{border-color:var(--acc);color:var(--acc)}

.lx-main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) var(--pw);transition:grid-template-columns .25s ease}
.lx-stagewrap{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;background:var(--stage)}
.lx-stagebox{position:relative;flex:1;min-height:0;display:flex}
.lab-stage{flex:1;min-width:0;min-height:0;display:flex;gap:12px;padding:16px 16px 10px}
.lx-stagewrap.go .lx-stagebox{animation:lxgo .9s ease-out}
@keyframes lxgo{0%{box-shadow:inset 0 0 0 3px var(--acc)}100%{box-shadow:inset 0 0 0 0 transparent}}
.lx-stagebox.lx-flash{animation:lxgo 1s ease-out}
/* frozen while the question is open: no pointer, no instruction in the caption; the notice is in the bar */
.lx-stagewrap.locked .lx-stagebox{cursor:not-allowed}
.lx-stagewrap.locked .lab-cap{visibility:hidden}
.lx-status svg{width:16px;height:16px;margin-right:6px;vertical-align:-2px}
.lx-pings{position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden}
.lx-ping{position:absolute;width:72px;height:72px;margin:-36px 0 0 -36px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px #000a,inset 0 0 0 3px #000a;animation:lxping 1.1s ease-out 2 both}
@keyframes lxping{0%{transform:scale(.45);opacity:1}100%{transform:scale(1.35);opacity:0}}
/* the controls, under the picture on a phone */
.lx-dock{flex:none;max-height:44%;overflow:auto;padding:2px 16px 10px;background:var(--stage)}
.lx-dock .lab-ctl{gap:2px}
.lx-dock .lab-row{padding:3px 10px}
.lx-dock .lab-row label{font-size:16px}
.lx-dock .lab-read{padding:8px 12px;min-height:0}
/* the bar along the bottom edge of the picture: progress or result, Next when the panel is away */
.lx-bar{flex:none;display:flex;align-items:center;gap:8px;min-height:60px;padding:6px 10px 6px 14px;border-top:1px solid var(--line);background:var(--panel)}
.lx-brief{flex:1;min-width:0;display:flex;align-items:center;gap:10px}
.lx-bmark{flex:none;display:grid;place-items:center;min-width:34px;height:34px;padding:0 9px;border-radius:17px;font-weight:700;font-size:16px;background:#232c3b;color:#c9cfdd;font-variant-numeric:tabular-nums}
.lx-bmark:empty{display:none}
.lx-bmark svg{width:16px;height:16px}
.lx-bmark.n{background:#173a37;color:#9ff0e7;border:1px solid #2c6b64}
.lx-bmark.ok{background:var(--ok);color:#0b1a10}
.lx-bmark.no{background:#e8eaf0;color:#131821}
.lx-btext{flex:1;min-width:0;text-align:left;background:none;border:0;border-radius:8px;padding:6px 6px;font-size:16px;line-height:1.35;color:var(--text);cursor:pointer}
.lx-btext:hover{background:#1b2230}
.lx-brief[data-phase=ask] .lx-btext{color:#d4d9e4}
.lx-brief.nudging .lx-btext{color:var(--gold)}
.lx-bnext{flex:none;display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 16px;border-radius:12px;background:var(--acc);color:var(--acc-ink) !important;border:0;font-weight:700 !important;font-size:16px;cursor:pointer;white-space:nowrap}
.lx-bnext:hover{filter:brightness(1.08)}
.lx-fsx{display:none}
.lx.full .lx-fsx{display:inline-flex}

.lx-panel{display:flex;flex-direction:column;min-height:0;min-width:0;background:var(--panel);border-left:1px solid var(--line);position:relative}
.lx:not(.stack) .lx-panel{align-self:start;max-height:100%;border-bottom:1px solid var(--line);border-bottom-left-radius:16px}
.lx-handle,.lx-strip{display:none}
.lx-phead{display:flex;align-items:center;gap:8px;min-height:56px;padding:6px 6px 6px 20px;border-bottom:1px solid var(--line);flex:none}
.lx-status{font-size:16px;font-weight:600;color:var(--acc);min-width:0}
.lx[data-phase=ask] .lx-status{color:var(--muted)}
.lx-pips{display:none}
.lx-grow{flex:1}
.lx-tog{display:inline-flex;align-items:center;gap:4px;height:44px;min-width:44px;padding:0 8px 0 12px;border-radius:10px;background:none;border:1px solid transparent;color:var(--muted);font-size:16px;cursor:pointer;flex:none}
.lx-tog:hover{background:#1e2633;border-color:var(--line);color:var(--text)}
.lx-phead .lx-say,.lx-phead .lx-fs{height:42px;padding:0 12px;font-size:16px}
.lx-scroll{flex:0 1 auto;min-height:0;overflow:auto;padding:20px;display:flex;flex-direction:column;gap:18px;overscroll-behavior:contain}
.lx-scroll>*{flex-shrink:0}
.lx-morebar{display:none}
.lx-panel.more .lx-morebar{display:flex;flex:none;align-items:center;justify-content:center;gap:6px;width:100%;min-height:40px;padding:0;background:var(--panel);border:0;border-top:1px solid var(--line);box-shadow:0 -14px 16px -6px #0009;color:var(--text);font-size:16px;font-weight:600;cursor:pointer;position:relative;z-index:1}
.lx-act{flex:none;padding:12px 20px 16px;border-top:1px solid var(--line);background:var(--panel)}
.lx-act:empty{display:none}

.lx-guide{display:flex;flex-direction:column;gap:14px}
.lx-q{font-size:20px;line-height:1.35;font-weight:600;margin:0;text-wrap:balance}
.lx-q:focus{outline:none}
.lx-hint{margin:0;color:var(--muted);font-size:16px}
.lx-choices{display:flex;flex-direction:column;gap:10px}
.lx-choice{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;text-align:left;padding:10px 16px;border:1.5px solid #34405a;background:var(--card);border-radius:12px;font-size:17px;cursor:pointer;transition:border-color .15s,background .15s}
.lx-choice:hover{border-color:var(--acc);background:#1c2738}
.lx-choice .k{flex:none;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#273246;color:#c9cfdd;font-size:14px;font-weight:700}
.lx-shake{animation:lxshake .45s ease-in-out}
@keyframes lxshake{0%,100%{transform:none}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.lx-said{margin:0;padding:10px 14px;border-radius:12px;background:#1d1a10;border:1px solid #4d4220;font-size:16px;line-height:1.45;color:#ece3c6;outline:none}
.lx-said b{color:var(--gold)}
.lx-goal{font-size:19px;line-height:1.4;font-weight:600;margin:0;text-wrap:balance}
.lx-donel{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.lx-donel li{display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:start;padding:0 4px;color:#b3c2b9;font-size:16px;line-height:1.4}
.lx-donel .m{width:20px;height:20px;margin-top:2px;border-radius:50%;display:grid;place-items:center;background:var(--ok);color:#0b1a10;font-size:12px;font-weight:800}
.lx-donel li.just .m{animation:lxpop .45s cubic-bezier(.3,1.6,.5,1)}
@keyframes lxpop{0%{transform:scale(.4)}100%{transform:scale(1)}}
.lx-now{display:flex;flex-direction:column;align-items:stretch;gap:6px;width:100%;text-align:left;padding:14px 16px;border-radius:14px;background:#13242a;border:1.5px solid #2c5f5a;box-shadow:inset 4px 0 0 var(--acc);cursor:pointer}
.lx-now:hover{border-color:var(--acc)}
.lx-nowl{display:flex;align-items:center;gap:8px;font-size:16px;color:#b9c6d6}
.lx-nowl b{color:var(--acc);font-weight:700}
.lx-nowl .dots{display:flex;gap:6px;margin-left:auto}
.lx-nowl .dots i{width:10px;height:10px;border-radius:50%;background:#2f394b}
.lx-nowl .dots i.on{background:var(--ok)}.lx-nowl .dots i.cur{background:var(--acc)}
.lx-nowt{font-size:19px;line-height:1.38;font-weight:600;color:#fff}
.lx-nudge{color:var(--gold);font-size:16px;line-height:1.4}
.lx-where{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;font-size:16px;color:var(--acc)}
.lx-cue{outline:2px solid var(--acc);outline-offset:3px;border-radius:8px}
.lab-row.lx-cue{outline:0;background:#13242a;box-shadow:inset 0 0 0 2px var(--acc)}
.lab-row.lx-cue label{color:#9ff0e7}
.lab-row{padding:4px 8px}
.lx-cue-go{animation:lxcue 1s ease-out 2}
@keyframes lxcue{0%{filter:brightness(1.8)}100%{filter:none}}
.lx-verdict{display:grid;grid-template-columns:32px 1fr;gap:12px;align-items:start;padding:14px 16px;border-radius:12px;background:var(--card);border:1px solid #3a4659;outline:none}
.lx-verdict .m{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:17px}
.lx-verdict.ok .m{background:var(--ok);color:#0b1a10}
.lx-verdict.no .m{background:#e8eaf0;color:#131821}
.lx-verdict.plain .m{background:#2b3547;color:var(--text)}
.lx-verdict p{margin:0}.lx-verdict .big{font-size:18px;font-weight:600;line-height:1.4}
.lx-verdict p+p{margin-top:4px;color:#d4d9e4;line-height:1.45}
.lx-take{border-left:4px solid var(--gold);background:#1c1a12;padding:14px 16px;border-radius:0 12px 12px 0;font-size:17px;line-height:1.5}
.lx-take .l{display:block;font-size:16px;font-weight:600;color:var(--gold);margin-bottom:4px}
.lx-take b{color:#fff}
.lx-in{animation:lxin .3s ease-out}
@keyframes lxin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.lx-primary{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;padding:0 18px;background:var(--acc);color:var(--acc-ink) !important;border:0;border-radius:12px;font-weight:700 !important;font-size:17px;cursor:pointer}
.lx-primary:hover{filter:brightness(1.08)}
.lx-extra{display:flex;flex-direction:column;gap:16px}
.lx-extra[hidden]{display:none}
.lx-extra:empty{display:none}

/* folded panel, wide screens: a slim rail; the bar under the picture takes over */
.lx.collapsed .lx-scroll,.lx.collapsed .lx-act,.lx.collapsed .lx-morebar{display:none}
.lx:not(.stack).collapsed .lx-phead{flex-direction:column;padding:10px 0;border-bottom:0;gap:14px}
.lx:not(.stack).collapsed .lx-status,.lx:not(.stack).collapsed .lx-phead .lx-say{display:none}
.lx:not(.stack).collapsed .lx-tog{padding:0 10px}
.lx:not(.stack).collapsed .lx-tog .t{display:none}
.lx:not(.stack).collapsed .lx-pips{display:flex;flex-direction:column;gap:8px;align-items:center}
.lx-pips i{width:12px;height:12px;border-radius:50%;background:#2f394b}.lx-pips i.on{background:var(--ok)}

/* full screen stage */
.lx.full .lx-top,.lx.full .lx-panel{display:none}
.lx.full .lx-main{grid-template-columns:minmax(0,1fr)}

/* theory: beside the picture on a wide screen, a sheet on a phone */
.lx-scrim{position:absolute;inset:0;background:#0009;opacity:0;pointer-events:none;transition:opacity .25s;z-index:5}
.lx-drawer{position:absolute;top:56px;right:0;bottom:0;width:var(--pw);background:var(--panel);border-left:1px solid var(--line);display:flex;flex-direction:column;transform:translateX(102%);transition:transform .28s ease;z-index:6}
.lx.theory .lx-drawer{transform:none}
.lx.stack.theory .lx-scrim{opacity:1;pointer-events:auto}
.lx-dhead{display:flex;align-items:center;gap:10px;min-height:56px;padding:6px 6px 6px 22px;border-bottom:1px solid var(--line)}
.lx-dhead h2{margin:0;font-size:18px;flex:1}
.lx-drawer .hb-page article{padding:20px 22px 60px}
.lx-drawer .hb-page h2{font-size:26px}
.lx-aboutw{max-width:760px;margin:0 auto;padding:18px 22px 0}
.lx-about{margin:0 0 6px;padding:12px 14px;border-radius:10px;background:var(--card);font-size:16px;color:var(--text)}
.lx-about b{display:block;font-size:16px;color:var(--muted);margin-bottom:2px}

/* upright screens and narrow windows: stage on top, panel as a bottom sheet */
.lx.stack .lx-top{height:52px;padding:0 4px 0 8px;gap:4px}
.lx.stack .lx-steps .lx-step{padding:0 8px}
.lx.stack .lx-steps .lx-step .t{display:none}
.lx.stack .lx-step.cur .m{width:30px;height:30px;border-width:3px}
.lx.stack .lx-link{flex-basis:8px}
.lx.stack .lx-btn{padding:0 12px;gap:6px}
.lx.stack .lx-main{display:flex;flex-direction:column}
.lx.stack .lx-stagewrap{flex:1 1 auto}
.lx.stack .lab-stage{padding:8px 8px 6px}
.lx.stack .lx-bar{display:none;min-height:52px;padding:6px 8px 6px 12px;flex-wrap:wrap;justify-content:flex-end;row-gap:4px}
.lx.stack .lx-bar .lx-brief{flex:1 1 100%;flex-wrap:wrap}
.lx.stack.full .lx-bar,.lx.stack.collapsed[data-phase=ask] .lx-bar{display:flex}
.lx.stack .lx-brief .lx-bnext{flex:1 1 100%;justify-content:center}
.lx.stack .lx-panel{flex:none;max-height:var(--sheet,54%);padding-top:10px;border-left:0;border-top:1px solid var(--line);border-radius:18px 18px 0 0;z-index:2;box-shadow:0 -4px 12px #0007}
.lx.stack .lx-panel.sized{height:var(--sheet);max-height:none}
.lx.stack .lx-panel::before{content:'';position:absolute;top:6px;left:50%;width:44px;height:5px;margin-left:-22px;border-radius:3px;background:#5b6880}
.lx.stack[data-phase=done]:not(.collapsed) .lx-panel{max-height:var(--sheet,66%)}
.lx.stack .lx-handle{display:inline-flex;align-items:center;flex:none;height:44px;padding:0 10px;background:none;border:1px solid transparent;border-radius:10px;color:#c9cfdd;font-size:16px;touch-action:none;cursor:grab}
.lx.stack .lx-handle:hover{border-color:var(--line)}
.lx-handle .grab{display:none}
.lx-handle .lab{display:inline-flex;align-items:center;gap:4px;line-height:1.2}
.lx.stack .lx-phead{padding:0 4px 2px 18px;min-height:48px;gap:4px;touch-action:none;border-bottom:0}
.lx.stack .lx-status{font-size:18px;font-weight:700;color:var(--text);line-height:1.25}
.lx.stack .lx-tog,.lx.stack .lx-pips{display:none}
.lx.stack .lx-phead .lx-fs .t{display:none}
.lx.stack .lx-phead .lx-fs{padding:0;width:44px;justify-content:center}
.lx.stack.collapsed .lx-phead{display:none}
.lx.stack.collapsed .lx-strip{display:flex;align-items:flex-start;gap:4px;padding:2px 6px 10px 12px}
.lx-strip .lx-brief{flex-wrap:wrap;row-gap:8px}
.lx.stack .lx-scroll{padding:4px 16px 14px;gap:12px}
.lx.stack .lx-choices.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.lx.stack .lx-choices.two .lx-choice{padding:8px 10px;font-size:16px;gap:8px}
.lx.stack .lx-pick,.lx.stack .lx-donel,.lx.stack .lx-keep{display:none}
.lx.stack .lx-goal{font-size:17px}
.lx.stack .lx-q{font-size:19px}
.lx.stack .lx-take{font-size:16px;padding:12px 14px}
.lx.stack .lx-verdict{padding:12px 14px}
.lx.stack .lx-act{padding:10px 16px 14px}
.lx.stack .lx-drawer{top:auto;left:0;width:auto;height:90%;border-left:0;border-top:1px solid var(--line);border-radius:18px 18px 0 0;transform:translateY(102%);box-shadow:0 -20px 60px #0008}
.lx.stack.theory .lx-drawer{transform:none}
.lx.stack .lx-dock .lab-row input[type=range]{height:40px}

@media (prefers-reduced-motion:reduce){.hb-say[aria-pressed=true]::before{animation:none}.lx *,.lx *::before{animation:none !important;transition:none !important}.lx-ping{opacity:1}}

/* ---- controls that stations use ---- */
.lab-box{flex:1;min-width:0;min-height:0;position:relative;background:var(--bg);border-radius:10px;overflow:auto}
.lab-col{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:12px}
.lab-view{flex:1;min-width:0;min-height:0;position:relative;display:flex;flex-direction:column;gap:8px}
.lab-cv{flex:1;min-width:0;min-height:0;position:relative;border-radius:10px;overflow:hidden}
.lab-view canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block}
.lab-view canvas:focus{outline:none}
.lab-cap{flex:none;max-width:100%;min-height:28px;padding:2px 4px;font-size:17px;font-weight:600;color:var(--text);line-height:1.4}
.lab-cap[hidden]{display:none}
.lab-tip{position:absolute;z-index:2;pointer-events:none;max-width:280px;padding:8px 12px;border-radius:8px;background:#0b0e14f0;border:1px solid #3a4659;color:#fff;font-size:15px;line-height:1.4;font-variant-numeric:tabular-nums}
.lab-tip b{color:var(--gold)}
.lab-tip.dock{max-width:calc(100% - 12px)}
.lab-ctl{display:flex;flex-direction:column;gap:16px}
.lab-ctl:empty{display:none}
.lab-seg{display:flex;border:1px solid #34405a;border-radius:10px;overflow:hidden}
.lab-seg button{flex:1;min-height:44px;background:var(--card);border:0;border-right:1px solid #34405a;color:#d4d9e4;padding:8px 10px;font-size:16px;cursor:pointer}
.lab-seg button:last-child{border-right:0}
.lab-seg button[aria-pressed=true]{background:var(--acc);color:var(--acc-ink);font-weight:600}
.lab-row label{display:flex;justify-content:space-between;gap:12px;font-size:16px;color:var(--text)}
.lab-row output{color:var(--gold);font-weight:600;font-variant-numeric:tabular-nums}
.lab-row{border-radius:8px}
.lab-row input[type=range]{-webkit-appearance:none;appearance:none;display:block;width:100%;height:36px;margin:0;background:transparent;cursor:pointer;touch-action:pan-y}
.lab-row input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:#3a4659}
.lab-row input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;margin-top:-11px;border-radius:50%;background:var(--acc);border:3px solid #0d1016;box-shadow:0 0 0 1px var(--acc)}
.lab-row input[type=range]::-moz-range-track{height:6px;border-radius:3px;background:#3a4659}
.lab-row input[type=range]::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:var(--acc);border:3px solid #0d1016}
.lab-row input[type=range]:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.lab-read{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:16px;font-variant-numeric:tabular-nums;min-height:48px}
.lab-read b{color:var(--gold)}
.lab-read code,.lab-take code,.lx-take code,.hb-page code{font:15px ui-monospace,Menlo,Consolas,monospace;color:#9fe3db}
.lab-k{font-size:16px;font-weight:600;color:var(--muted);margin-bottom:6px}
.lab-btn{min-height:44px;background:var(--card);border:1px solid #34405a;color:var(--text);border-radius:10px;padding:8px 14px;font-size:16px;cursor:pointer}
.lab-btn:hover{border-color:var(--acc)}
.lab-btn[aria-pressed=true]{border-color:var(--gold);color:var(--gold);background:#231f12}
.lab-chips{display:flex;flex-wrap:wrap;gap:6px}
.lab-chip{border:1px solid var(--line);border-radius:999px;padding:3px 10px;font-size:16px;color:var(--muted)}
.lab-chip.on{border-color:var(--ok);color:var(--ok)}
.lab-panel{background:var(--bg);border:1px solid var(--line);border-radius:10px;overflow:auto;min-height:0}
.lab-take{border-left:3px solid var(--gold);background:#1c1a12;padding:10px 12px;border-radius:0 8px 8px 0}

/* ---- reading wall ---- */
.hb-page{flex:1;overflow:auto;scroll-behavior:smooth}
.hb-page:focus,.mm:focus{outline:none}
.hb-page article{max-width:760px;margin:0 auto;padding:28px 22px 80px;font-size:17px;line-height:1.65}
.hb-page h2{font-size:30px;line-height:1.2;margin:8px 0 6px;text-wrap:balance}
.hb-page h3{font-size:20px;margin:38px 0 6px;color:var(--gold)}
.hb-page p{margin:10px 0}.hb-page .lead{color:var(--muted);font-size:18px}
.hb-page figure{margin:18px 0}.hb-page figcaption{font-size:15px;color:var(--muted);margin-top:6px}
.hb-figrow{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.hb-figrow img,.hb-page canvas{width:100%;display:block;border-radius:8px;background:#000}
.hb-page img{image-rendering:auto}
.hb-key{border-left:3px solid var(--acc);background:#121c20;padding:10px 14px;border-radius:0 8px 8px 0}
.hb-num{font-size:15px;color:var(--acc)}
.hb-det{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px 14px}.hb-det summary{cursor:pointer;color:var(--muted)}
.hb-rem{border-left:3px solid var(--gold);background:#1c1a12;margin:8px 0;padding:10px 14px 10px 34px;border-radius:0 8px 8px 0}.hb-rem li{margin:4px 0}
.hb-go{display:inline-block;margin-top:14px;background:var(--acc);color:var(--acc-ink) !important;border:0;border-radius:10px;padding:12px 18px;font:600 16px system-ui,sans-serif;cursor:pointer}
`;
