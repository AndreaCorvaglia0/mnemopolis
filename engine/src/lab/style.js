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
.hb-close,.lx-x{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:44px;height:44px;padding:0 12px;background:none;border:1px solid transparent;border-radius:10px;cursor:pointer;white-space:nowrap;flex:none}
.hb-close:hover,.lx-x:hover{background:#1e2633;border-color:var(--line)}

/* ---- the lab frame ---- */
.lx-top{display:flex;align-items:center;gap:10px;height:56px;padding:0 6px 0 16px;border-bottom:1px solid var(--line);background:var(--panel);flex:none}
.lx-name{flex:0 1 auto;min-width:0;max-width:24ch;font-size:16px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lx-steps{flex:1 1 0;min-width:0;display:flex;align-items:center;gap:2px;overflow:hidden}
.lx-step{flex:0 1 auto;min-width:44px;height:44px;display:flex;align-items:center;gap:8px;padding:0 12px 0 9px;border-radius:22px;background:none;border:0;color:var(--muted);font-size:16px;cursor:pointer}
.lx-step .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lx-step .m{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;border:2px solid #435069;font-weight:700;font-size:14px;line-height:1}
.lx-step:hover{background:#1b2230;color:var(--text)}
.lx-step.done .m{background:var(--ok);border-color:var(--ok);color:#0b1a10}
.lx-step.cur{flex:0 0 auto;max-width:min(380px,60%);background:#1e2836;color:#fff;font-weight:600}
.lx-step.cur .m{border-color:var(--acc);color:var(--acc)}
.lx-step.cur.done .m{color:#0b1a10}
.lx-steps.many .lx-step:not(.cur){padding:0 9px}.lx-steps.many .lx-step:not(.cur) .t{display:none}
.lx-tools{display:flex;align-items:center;gap:4px;flex:none}
.lx-btn{display:inline-flex;align-items:center;gap:8px;height:44px;min-width:44px;padding:0 14px;border-radius:10px;background:none;border:1px solid var(--line);cursor:pointer;font-size:16px;white-space:nowrap}
.lx-btn:hover{background:#1e2633;border-color:#3a4659}
.lx-btn[aria-pressed=true]{border-color:var(--acc);color:var(--acc)}

.lx-main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) var(--pw,380px);transition:grid-template-columns .25s ease}
.lx-main.wide{--pw:540px}
@media (max-width:1100px),(max-height:520px){.lx-main{--pw:330px}.lx-main.wide{--pw:440px}.lx-scroll{padding:16px}}
.lx.collapsed .lx-main{--pw:72px}
.lx-stagewrap{position:relative;min-width:0;min-height:0;display:flex;background:var(--stage)}
.lab-stage{flex:1;min-width:0;min-height:0;display:flex;gap:12px;padding:16px}
.lx-stagewrap.go{animation:lxgo .9s ease-out}
@keyframes lxgo{0%{box-shadow:inset 0 0 0 3px var(--acc)}100%{box-shadow:inset 0 0 0 0 transparent}}
.lx-stagewrap.locked .lab-stage{cursor:not-allowed}
.lx-lock{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);display:none;align-items:center;gap:8px;max-width:calc(100% - 32px);padding:10px 18px;border-radius:999px;background:#0b0e14e6;border:1px solid #3a4659;color:#fff;font-size:16px;white-space:nowrap;pointer-events:none}
.lx-stagewrap.locked .lx-lock{display:flex}
.lx-fs{position:absolute;top:20px;right:20px;width:44px;height:44px;display:grid;place-items:center;border-radius:10px;background:#0b0e14cc;border:1px solid #3a4659;cursor:pointer;z-index:3}
.lx-fs:hover{border-color:var(--acc)}

.lx-panel{display:flex;flex-direction:column;min-height:0;min-width:0;background:var(--panel);border-left:1px solid var(--line);position:relative}
.lx-phead{display:flex;align-items:center;gap:8px;min-height:56px;padding:6px 6px 6px 20px;border-bottom:1px solid var(--line);flex:none}
.lx-status{font-size:15px;font-weight:600;color:var(--muted);white-space:nowrap}
.lx-status b{color:var(--acc);font-weight:600}
.lx-sum{display:none;flex:1;min-width:0;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lx-pips{display:none}
.lx-grow{flex:1}
.lx-mini{display:none}
.lx-tog{width:44px;height:44px;display:grid;place-items:center;border-radius:10px;background:none;border:1px solid transparent;cursor:pointer;flex:none}
.lx-tog:hover{background:#1e2633;border-color:var(--line)}
.lx-tog svg{transition:transform .25s}
.lx-scroll{flex:1;min-height:0;overflow:auto;padding:20px;display:flex;flex-direction:column;gap:20px;overscroll-behavior:contain}
.lx-scroll>*{flex-shrink:0}
.lx-more{position:absolute;right:14px;bottom:calc(var(--actH,0px) + 10px);display:none;align-items:center;justify-content:center;gap:4px;width:40px;height:40px;padding:0;border-radius:50%;box-shadow:0 4px 14px #000a;background:#253042;border:1px solid #3a4659;font-size:15px;cursor:pointer;z-index:2}
.lx-panel.more .lx-more{display:flex}
.lx-panel.more .lx-scroll{-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 56px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 56px),transparent)}
.lx-act{flex:none;padding:12px 20px 16px;border-top:1px solid var(--line);background:var(--panel)}
.lx-act:empty{display:none}

.lx-q{font-size:20px;line-height:1.35;font-weight:600;margin:0;text-wrap:balance}
.lx-hint{margin:0;color:var(--muted);font-size:16px}
.lx-choices{display:flex;flex-direction:column;gap:10px}
.lx-choice{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;text-align:left;padding:10px 16px;border:1.5px solid #34405a;background:var(--card);border-radius:12px;font-size:17px;cursor:pointer;transition:border-color .15s,background .15s}
.lx-choice:hover{border-color:var(--acc);background:#1c2738}
.lx-choice .k{flex:none;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#273246;color:var(--muted);font-size:14px;font-weight:700}
.lx-said{display:flex;flex-direction:column;gap:4px;padding:14px 16px;border-radius:12px;background:#1f1c12;border:1px solid #574a20;outline:none}
.lx-said .l{font-size:15px;color:#e9d9a6}
.lx-said b{font-size:19px;color:var(--gold)}
.lx-goal{font-size:19px;line-height:1.4;font-weight:600;margin:0;text-wrap:balance}
.lx-thead{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.lx-thead h3{margin:0;font-size:17px}
.lx-thead span{font-size:15px;color:var(--muted)}
.lx-tries{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.lx-tries li{display:grid;grid-template-columns:28px 1fr;gap:12px;align-items:start;padding:10px 12px;border-radius:10px;color:var(--muted);font-size:16px;line-height:1.45}
.lx-tries .m{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:#232c3b;color:var(--muted);margin-top:-2px}
.lx-tries li.now{background:#15232b;color:#fff;box-shadow:inset 3px 0 0 var(--acc)}
.lx-tries li.now .m{background:var(--acc);color:var(--acc-ink)}
.lx-tries li.done{color:#a4b4ab}
.lx-tries li.done .m{background:var(--ok);color:#0b1a10}
.lx-tries li.just .m{animation:lxpop .45s cubic-bezier(.3,1.6,.5,1)}
.lx-tries li.just{animation:lxflash 1s ease-out}
@keyframes lxpop{0%{transform:scale(.4)}100%{transform:scale(1)}}
@keyframes lxflash{0%{background:#1d3a28}100%{background:transparent}}
.lx-verdict{display:grid;grid-template-columns:32px 1fr;gap:12px;align-items:start;padding:14px 16px;border-radius:12px;background:#13241a;border:1px solid #2f6140;outline:none}
.lx-verdict .m{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--ok);color:#0b1a10;font-weight:800}
.lx-verdict.wrong{background:#231d10;border-color:#6b5420}
.lx-verdict.wrong .m{background:var(--gold);color:#2a2008}
.lx-verdict.plain{background:var(--card);border-color:#3a4659}.lx-verdict.plain .m{background:#2b3547;color:var(--text)}
.lx-q:focus{outline:none}
.lx-verdict p{margin:0}.lx-verdict .big{font-size:18px;font-weight:600}
.lx-take{border-left:4px solid var(--gold);background:#1c1a12;padding:14px 16px;border-radius:0 12px 12px 0;font-size:17px;line-height:1.5}
.lx-take .l{display:block;font-size:15px;font-weight:600;color:var(--gold);margin-bottom:4px}
.lx-take b{color:#fff}
.lx-in{animation:lxin .3s ease-out}
@keyframes lxin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.lx-primary{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;padding:0 18px;background:var(--acc);color:var(--acc-ink) !important;border:0;border-radius:12px;font-weight:700 !important;font-size:17px;cursor:pointer}
.lx-primary:hover{filter:brightness(1.08)}
.lx-primary .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lx-extra{display:flex;flex-direction:column;gap:16px}
.lx-extra[hidden]{display:none}

/* collapsed panel, wide screens: a slim rail */
.lx.collapsed .lx-scroll,.lx.collapsed .lx-act,.lx.collapsed .lx-more{display:none}
.lx:not(.stack).collapsed .lx-phead{flex-direction:column;padding:8px 0;border-bottom:0;gap:12px}
.lx:not(.stack).collapsed .lx-status{display:none}
.lx:not(.stack).collapsed .lx-pips{display:flex;flex-direction:column;gap:8px;align-items:center}
.lx:not(.stack).collapsed .lx-tog svg{transform:rotate(180deg)}
.lx-pips i{width:12px;height:12px;border-radius:50%;background:#2f394b}.lx-pips i.on{background:var(--ok)}
.lx.collapsed .lx-mini{display:grid}
.lx-mini{place-items:center;min-width:52px;height:44px;padding:0 12px;border-radius:10px;background:var(--acc);color:var(--acc-ink) !important;border:0;font-weight:700 !important;cursor:pointer}

/* full screen stage */
.lx.full .lx-top,.lx.full .lx-panel{display:none}
.lx.full .lx-main{grid-template-columns:minmax(0,1fr)}

/* theory drawer */
.lx-scrim{position:absolute;inset:0;background:#0009;opacity:0;pointer-events:none;transition:opacity .25s;z-index:5}
.lx-drawer{position:absolute;top:0;right:0;bottom:0;width:min(600px,94vw);background:var(--panel);border-left:1px solid var(--line);display:flex;flex-direction:column;transform:translateX(102%);transition:transform .28s ease;z-index:6;box-shadow:-20px 0 60px #0008}
.lx.theory .lx-scrim{opacity:1;pointer-events:auto}
.lx.theory .lx-drawer{transform:none}
.lx-dhead{display:flex;align-items:center;gap:10px;min-height:56px;padding:6px 6px 6px 22px;border-bottom:1px solid var(--line)}
.lx-dhead h2{margin:0;font-size:18px;flex:1}
.lx-drawer .hb-page article{padding:22px 24px 60px}
.lx-about{margin:0 0 6px;padding:12px 14px;border-radius:10px;background:var(--card);font-size:16px;color:var(--text)}
.lx-about b{display:block;font-size:15px;color:var(--muted);margin-bottom:2px}

/* upright screens and narrow windows: stage on top, panel as a bottom sheet */
.lx.stack .lx-name{display:none}
.lx.stack .lx-top{height:52px;padding:0 4px 0 6px;gap:4px}
.lx.stack .lx-step{padding:0 10px 0 8px}
.lx.stack .lx-step.cur{max-width:none;flex:0 1 auto;min-width:0}.lx.stack .lx-steps .lx-step:not(.cur){padding:0 9px}.lx.stack .lx-steps .lx-step:not(.cur) .t{display:none}
.lx.stack .lx-btn{padding:0 10px;gap:6px;font-size:15px}
.lx.stack .lx-main{display:flex;flex-direction:column}
.lx.stack .lx-stagewrap{flex:1 1 auto}
.lx.stack .lab-stage{padding:8px 8px 22px}
.lx.stack .lx-tries li:not(.now):not(.just){display:none}
.lx.stack .lx-alldone{display:none !important}
.lx.stack .lx-fs{top:12px;right:12px}
.lx.stack .lx-lock{bottom:12px}
.lx.stack .lx-panel{flex:none;max-height:var(--sheet,46%);border-left:0;border-top:1px solid var(--line);border-radius:18px 18px 0 0;margin-top:-14px;z-index:2;box-shadow:0 -10px 30px #000a}
.lx.stack .lx-panel.sized{height:var(--sheet);max-height:none}
.lx.stack .lx-phead{position:relative;padding:12px 4px 0 18px;min-height:52px;touch-action:none;cursor:grab;border-bottom:0}
.lx.stack .lx-phead::before{content:'';position:absolute;top:6px;left:50%;width:44px;height:5px;margin-left:-22px;border-radius:3px;background:#4a5568}
.lx.stack .lx-scroll{padding:4px 16px 16px;gap:14px}
.lx.stack .lx-choices.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.lx.stack .lx-choices.two .lx-choice{padding:8px 10px;font-size:16px;gap:8px}
.lx.stack .lx-said{padding:10px 14px;flex-direction:row;flex-wrap:wrap;align-items:baseline;column-gap:8px}
.lx.stack .lx-hint{font-size:16px}.lx.stack .lx-pick{display:none}
.lx.stack .lx-act{padding:10px 16px 14px}
.lx.stack.collapsed .lx-panel{height:auto;max-height:none}
.lx.stack.collapsed .lx-sum{display:block}
.lx.stack.collapsed .lx-status{display:none}
.lx.stack .lx-tog svg{transform:rotate(90deg)}
.lx.stack.collapsed .lx-tog svg{transform:rotate(-90deg)}
.lx.stack .lx-drawer{top:auto;left:0;width:auto;height:90%;border-left:0;border-top:1px solid var(--line);border-radius:18px 18px 0 0;transform:translateY(102%)}
.lx.stack.theory .lx-drawer{transform:none}
.lx.stack .lx-q{font-size:19px}

@media (prefers-reduced-motion:reduce){.lx *,.lx *::before{animation:none !important;transition:none !important}}

/* ---- controls that stations use ---- */
.lab-box{flex:1;min-width:0;min-height:0;position:relative;background:var(--bg);border-radius:10px;overflow:auto}
.lab-col{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:12px}
.lab-view{flex:1;min-width:0;min-height:0;position:relative;display:flex;flex-direction:column;gap:8px}
.lab-cv{flex:1;min-width:0;min-height:0;position:relative;border-radius:10px;overflow:hidden}
.lab-view canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block}
.lab-view canvas:focus{outline:none}
.lab-cap{flex:none;max-width:calc(100% - 60px);min-height:28px;padding:2px 4px;font-size:17px;font-weight:600;color:var(--text);line-height:1.4}
.lab-cap[hidden]{display:none}
.lab-tip{position:absolute;z-index:2;pointer-events:none;max-width:280px;padding:8px 12px;border-radius:8px;background:#0b0e14f0;border:1px solid #3a4659;color:#fff;font-size:15px;line-height:1.4;font-variant-numeric:tabular-nums}
.lab-tip b{color:var(--gold)}
.lab-ctl{display:flex;flex-direction:column;gap:16px}
.lab-ctl:empty{display:none}
.lab-seg{display:flex;border:1px solid #34405a;border-radius:10px;overflow:hidden}
.lab-seg button{flex:1;min-height:44px;background:var(--card);border:0;border-right:1px solid #34405a;color:#d4d9e4;padding:8px 10px;font-size:16px;cursor:pointer}
.lab-seg button:last-child{border-right:0}
.lab-seg button[aria-pressed=true]{background:var(--acc);color:var(--acc-ink);font-weight:600}
.lab-row label{display:flex;justify-content:space-between;gap:12px;font-size:16px;color:var(--text)}
.lab-row output{color:var(--gold);font-weight:600;font-variant-numeric:tabular-nums}
.lab-row input[type=range]{width:100%;height:32px;margin:2px 0 0;accent-color:var(--acc);cursor:pointer}
.lab-read{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:16px;font-variant-numeric:tabular-nums;min-height:48px}
.lab-read b{color:var(--gold)}
.lab-read code,.lab-take code,.lx-take code,.hb-page code{font:15px ui-monospace,Menlo,Consolas,monospace;color:#9fe3db}
.lab-k{font-size:15px;font-weight:600;color:var(--muted);margin-bottom:6px}
.lab-btn{min-height:44px;background:var(--card);border:1px solid #34405a;color:var(--text);border-radius:10px;padding:8px 14px;font-size:16px;cursor:pointer}
.lab-btn:hover{border-color:var(--acc)}
.lab-btn[aria-pressed=true]{border-color:var(--gold);color:var(--gold);background:#231f12}
.lab-chips{display:flex;flex-wrap:wrap;gap:6px}
.lab-chip{border:1px solid var(--line);border-radius:999px;padding:3px 10px;font-size:15px;color:var(--muted)}
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
