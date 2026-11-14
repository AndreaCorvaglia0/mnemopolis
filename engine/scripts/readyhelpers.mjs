// In-page helpers that do a station's tasks from their `when` conditions (ready-made patterns, and
// code stations that expose ctx.stage.__ready). Used by readyshots.mjs and by the play-through bot,
// which falls back on them for a station that has no hand-written recipe.
// act(k) does task k of the open station with pointer events and slider inputs
export const helpers = `window.__act=(k)=>{const st=document.querySelector('.lab-stage'),R=st&&st.__ready;if(!R)return 'no __ready';const w=R.t.whens[k];if(!w)return 'no when '+k;
const ev=(cv,t,x,y)=>cv.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:x,clientY:y,pointerId:1,pointerType:'mouse',buttons:t==='pointerup'?0:1}));
const drag=(p,x1,y1,x2,y2)=>{const[a1,b1]=p.toScreen(x1,y1),[a2,b2]=p.toScreen(x2,y2);ev(p.cv,'pointerdown',a1,b1);for(let i=1;i<=14;i++)ev(p.cv,'pointermove',a1+(a2-a1)*i/14,b1+(b2-b1)*i/14);ev(p.cv,'pointerup',a2,b2)};
const slide=(id,v)=>{const r=(R.el[id].querySelector?.('input'))||R.el[id];if(r.tagName!=='INPUT'){const b=[...R.el[id].querySelectorAll('button')].find(b=>+b.dataset.v===v)||R.el[id].querySelector('button:last-child');b.click();return}r.value=v;r.dispatchEvent(new Event('input',{bubbles:true}))};
const range=(id)=>{const r=R.el[id].querySelector?.('input');return r?[+r.min,+r.max,+r.step||1]:[0,1,1]};
const doIt=(w)=>{const[verb,a]=Object.entries(w)[0];
if(verb==='all'){a.forEach(doIt);return}if(verb==='any'){doIt(a[0]);return}
if(verb==='reach')slide(a.control,a.value??(a.min!=null&&a.max!=null?(a.min+a.max)/2:a.min??a.max));
if(verb==='cross'){const[mn,mx]=range(a.control);slide(a.control,a.above!=null?mx:mn)}
if(verb==='both'){const[mn,mx]=range(a.control);slide(a.control,mn);slide(a.control,mx)}
if(verb==='try'){const id=a.control||Object.keys(R.el||{})[0];if(id){const[mn,mx]=range(id);for(let i=0;i<a.count;i++)slide(id,mn+(mx-mn)*i/(a.count-1))}else if(R.cards){R.cards.slice(0,a.count).forEach(c=>{const b=R.bins[0];drag(R.pane,c.x+c.w/2,c.y+c.h/2,b.x+b.w/2,b.y+b.h/2)})}}
if(verb==='place'){const list=a.item?R.cards.filter(c=>c.id===a.item):R.cards;list.forEach(c=>{const b=R.bins.find(b=>b.id===(a.bin||c.bin));drag(R.pane,c.x+c.w/2,c.y+c.h/2,b.x+b.w/2,b.y+b.h*0.6)})}
if(verb==='select'){[].concat(a).forEach(id=>{const c=(R.cards||R.slots||[]).find(c=>c.id===id);if(c)drag(R.pane,c.x+c.w/2,c.y+c.h/2,c.x+c.w/2,c.y+c.h/2)})}
if(verb==='run'){if(a==='correct'){for(let i=0;i<R.slots.length;i++){const j=R.slots.findIndex(s=>s.k===i);if(j!==i){const s=R.slots[j],t=R.slots[i];drag(R.pane,s.x+s.w/2,s.y+s.h/2,t.x+t.w/2,t.y+t.h/2)}}}R.run()}
if(R.custom)R.custom(verb,a)};
doIt(w);return 'did '+k};
window.__runNow=()=>{const R=document.querySelector('.lab-stage').__ready;if(R&&R.run)R.run();return 1};1`;

