// Accessibility sanity check of the front page: text contrast (WCAG AA), heading order, landmarks, touch targets, alt text, tab order.
//   node engine/scripts/sitecheck.mjs <site dir>/index.html
import puppeteer from 'puppeteer-core';
import path from 'node:path';
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
const p=await b.newPage();await p.setViewport({width:1000,height:800});
await p.goto('file://' + path.resolve(process.argv[2] || 'site/index.html') + '#en');
const r=await p.evaluate(()=>{
 const lum=c=>{const [r,g,b]=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b};
 const bgOf=e=>{while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(.*, 0\)|transparent/.test(c))return c;e=e.parentElement}return 'rgb(13,16,22)'};
 const bad=[];let n=0;
 for(const e of document.querySelectorAll('body *')){if(![...e.childNodes].some(x=>x.nodeType==3&&x.textContent.trim()))continue;if(e.closest('svg'))continue;
  const cs=getComputedStyle(e);const f=lum(cs.color),g=lum(bgOf(e));const cr=(Math.max(f,g)+.05)/(Math.min(f,g)+.05);n++;
  const large=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.66&&+cs.fontWeight>=700);
  if(cr<(large?3:4.5))bad.push(e.tagName+' '+e.textContent.trim().slice(0,30)+' '+cr.toFixed(2));}
 const hs=[...document.querySelectorAll('h1,h2,h3')].map(h=>h.tagName[1]).join('');
 const small=[...document.querySelectorAll('a,button')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.height<44)&&!e.classList.contains('skip')}).map(e=>e.textContent.trim().slice(0,20)+' '+Math.round(e.getBoundingClientRect().height));
 return {checked:n,bad,hs,landmarks:['header','main','footer','nav'].map(t=>t+':'+document.querySelectorAll(t).length),small,h1:document.querySelectorAll('h1').length,imgs:[...document.images].map(i=>i.alt.length>5)}});
console.log(JSON.stringify(r,null,1));
// keyboard: tab order
await p.keyboard.press('Tab');
const order=[];for(let i=0;i<14;i++){order.push(await p.evaluate(()=>{const e=document.activeElement;const o=getComputedStyle(e).outlineStyle;return (e.textContent||'').trim().slice(0,24)+' ['+(e.getAttribute('href')||'')+'] outline:'+o}));await p.keyboard.press('Tab')}
console.log(order.join('\n'));await b.close();
