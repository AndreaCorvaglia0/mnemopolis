// Pictures of the lab frame, state by state, on a desktop window and on a phone held upright.
// Run: npm run shots:lab  (after npm run build). Saves to shots/lab/ and, if OUT2 is set, copies there.
//   1 before the prediction, 2 after it, 3 one task done (mid), 3f the same with the panel folded,
//   3u unfolded, 3s full screen; 4 all done (verdict and takeaway), 5 done with the panel folded,
//   6 theory open, 7 done in full screen; then the first state of every other station, and a mid
//   state (sliders moved) of the stations that have sliders (cones, wheel).
// The tasks are done with real pointer drags on the canvas, not by calling the station.
import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { LABS } from '../src/course/labs.js';

const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'shots', 'lab');
const html = path.join(here, '..', 'dist', 'index.html');
if (!existsSync(html)) { console.log('No build yet: run the build first.'); process.exit(1); }
for (const f of existsSync(out) ? readdirSync(out) : []) if (f.endsWith('.png')) rmSync(path.join(out, f));
mkdirSync(out, { recursive: true });
const enc = (js) => encodeURIComponent(js);
const ids = Object.keys(LABS);
// the station walked through: the first one with a prediction and at least two tasks on draggable discs
const [LAB, ST] = (process.env.STATION || 'lamps:0').split(':');

// drag(i, j): drag disc i of the station onto disc j (positions read from the pane), with pointer events
const helpers = `window.__drag=(fromI,toI,dx=0,dy=0)=>{const p=document.querySelector('.lab-view').__pane,it=p.items,a=it.find(o=>o.c===fromI),b=it.find(o=>o.c===toI);const [x1,y1]=p.toScreen(a.x,a.y),[x2,y2]=p.toScreen(b.x+dx,b.y+dy),cv=p.cv;const ev=(t,x,y)=>cv.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:x,clientY:y,pointerId:1,pointerType:'mouse',buttons:t==='pointerup'?0:1}));ev('pointerdown',x1,y1);for(let k=1;k<=12;k++)ev('pointermove',x1+(x2-x1)*k/12,y1+(y2-y1)*k/12);ev('pointerup',x2,y2);return 1};window.__slide=(i,f)=>{const r=document.querySelectorAll('.lx input[type=range]')[i];if(!r)return 'no slider';r.value=+r.min+(r.max-r.min)*f;r.dispatchEvent(new Event('input',{bubbles:true}));return 1};window.__fold=(v)=>{document.querySelector('.lx').__lab.setCollapsed(v);return 1};window.__full=(v)=>{document.querySelector('.lx').__lab.setFull(v);return 1};1`;
const lab = (id, k) => `eval:${enc(`(__game.scene.getScene('UI').lab('${id}',${k}),1)`)}`;
const click = (sel, i = 0) => `eval:${enc(`(document.querySelectorAll('${sel}')[${i}].click(),1)`)}`;
const check = `eval:${enc(`(()=>{const r=document.querySelector('.lx');if(!r)return 'no lab';const o=[];const vis=(e)=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0};for(const e of r.querySelectorAll('button,.lx-q,.lx-take,.lx-tries li,.lab-row,.lab-read'))if(vis(e)&&!e.closest('.lx-scroll')&&(r.classList.contains('theory')||!e.closest('.lx-drawer'))){const b=e.getBoundingClientRect();if(b.right>innerWidth+1||b.bottom>innerHeight+1)o.push('cut: '+(e.className||e.tagName)+' '+Math.round(b.right)+'x'+Math.round(b.bottom))}const s=r.querySelector('.lx-stagewrap').getBoundingClientRect(),p=r.querySelector('.lx-panel').getBoundingClientRect(),t=r.querySelector('.lx-top').getBoundingClientRect();for(const e of r.querySelectorAll('*')){if(!vis(e)||e.closest('.lx-drawer'))continue;const cs=getComputedStyle(e);if(cs.textOverflow==='ellipsis'&&e.scrollWidth>e.clientWidth+1&&e.textContent.trim())o.push('TRUNCATED: '+e.textContent.trim().slice(0,30))}const sc=r.querySelector('.lx-scroll');o.push('panel scrolls: '+(sc.scrollHeight>sc.clientHeight+2));o.push('stage '+Math.round(s.width)+'x'+Math.round(s.height)+' panel '+Math.round(p.width)+'x'+Math.round(p.height)+' header h '+Math.round(t.height));return o.join(' | ')})()`)}`;

function steps(tag) {
  const s = ['wait:9000', `eval:${enc('__hb.state.seenIntro=true')}`, 'key:Space', 'wait:4000', `eval:${enc(helpers)}`,
    `eval:${enc(`(__game.scene.getScene('Town').scene.start('Interior',{id:'${LAB}'}),1)`)}`, 'wait:2000',
    lab(LAB, ST), 'wait:2500', check, `shot:${tag}-1-before-prediction`,
    click('.lx-choice', 0), 'wait:1600', check, `shot:${tag}-2-after-prediction`,
    `eval:${enc("__drag('#ff0000','#00ff00')")}`, 'wait:1600', check, `shot:${tag}-3-mid`,
    `eval:${enc('__fold(true)')}`, 'wait:900', check, `shot:${tag}-3f-mid-folded`,
    `eval:${enc('__fold(false)')}`, 'wait:900', check, `shot:${tag}-3u-mid-unfolded`,
    `eval:${enc('__full(true)')}`, 'wait:900', check, `shot:${tag}-3s-mid-fullscreen`, `eval:${enc('__full(false)')}`, 'wait:700',
    `eval:${enc("__drag('#0000ff','#00ff00',-30,40)")}`, 'wait:300', `eval:${enc("__drag('#ff0000','#00ff00',-50,0)")}`, 'wait:2200', check, `shot:${tag}-4-done`,
    `eval:${enc('__fold(true)')}`, 'wait:900', check, `shot:${tag}-5-done-folded`, `eval:${enc('__fold(false)')}`, 'wait:900',
    click('.lx-theory'), 'wait:1400', `shot:${tag}-6-theory`, 'key:Escape', 'wait:700',
    `eval:${enc('__full(true)')}`, 'wait:900', check, `shot:${tag}-7-done-fullscreen`, 'key:Escape', 'wait:500', 'key:Escape', 'wait:800'];
  ids.forEach((id) => LABS[id].stations.forEach((st, k) => {
    if (id === LAB && String(k) === ST) return;
    s.push(lab(id, k), 'wait:2200', check, `shot:${tag}-first-${id}-${k + 1}-${st.id}`);
    if (id === 'cones' || id === 'wheel') s.push(`eval:${enc('__slide(0,0.6)')}`, 'wait:500', check, `shot:${tag}-mid-${id}-${k + 1}-${st.id}`);
    s.push('key:Escape', 'wait:600');
  }));
  return s.join(',');
}

let status = 0;
for (const [tag, vp, q] of [['desktop', '1440x800x1', '?lite&test'], ['phone', '390x844x2', '?lite&test&touch']]) {
  if (process.env.ONLY && process.env.ONLY !== tag) continue;
  const r = spawnSync('node', [path.join(here, 'shoot.mjs'), html, out, steps(tag)], { stdio: 'inherit', env: { ...process.env, VP: vp, Q: q } });
  status ||= r.status || 0;
}
if (process.env.OUT2) { mkdirSync(process.env.OUT2, { recursive: true }); for (const f of readdirSync(out)) copyFileSync(path.join(out, f), path.join(process.env.OUT2, f)); }
console.log(`Pictures are in ${out}${process.env.OUT2 ? ` and ${process.env.OUT2}` : ''}. Open them.`);
process.exit(status);
