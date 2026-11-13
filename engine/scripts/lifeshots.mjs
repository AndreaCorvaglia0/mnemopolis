// Pictures of the ambient-life layer (src/mechanics/): a thought outdoors and indoors, an animal
// reacting, a secret found, an obstacle tried and opened, the discoveries page, a painting.
// Run after a build: node scripts/lifeshots.mjs   (PHONE=1 for a phone held upright)
// OUT2=/tmp copies the pictures there as life-*.png (life-phone-*.png on a phone).
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PHONE = !!process.env.PHONE;
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'shots', PHONE ? 'life-phone' : 'life');
const chrome = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chrome) { console.log('No Chrome: nothing checked on screen.'); process.exit(0); }
for (const f of existsSync(out) ? readdirSync(out) : []) if (f.endsWith('.png')) rmSync(path.join(out, f));
mkdirSync(out, { recursive: true });
const { lifePlan } = await import('../src/mechanics/active.js');
const { PLACES } = await import('../src/data/content.js');
const { lifeContext } = await import('../src/mechanics/context.js');
const { TOWN } = await import('../src/world/townMap.js');
const { dressingPlan } = await import('../src/mechanics/active.js');
const c = lifeContext(TOWN, dressingPlan());
// a free tile the player can reach, between dmin and dmax steps (straight line) from x, y; below it if possible
const stand = (x, y, dmin, dmax) => { let best = null; for (let j = -dmax; j <= dmax; j++) for (let i = -dmax; i <= dmax; i++) { const d = Math.hypot(i, j); if (d < dmin || d > dmax || !c.walk(x + i, y + j) || !c.reached(x + i, y + j)) continue; const s = Math.abs(i) + (j < 0 ? 5 : 0); if (!best || s < best[2]) best = [x + i, y + j, s]; } return best || [x, y + dmin]; };
const plan = lifePlan(), S = (k) => plan.secrets.find((s) => s.kind === k), enc = encodeURIComponent;
const T = "__game.scene.getScene('Town')";
const go = (x, y, dir = 'up') => `eval:${enc(`(()=>{const s=${T};s.player.tx=${x};s.player.ty=${y};s.player.place();s.player.face('${dir}');s.cameras.main.startFollow(s.player.sprite);s.showWhere(${x},${y});return 1})()`)}`;
const tod = (want) => `eval:${enc(`(()=>{const s=${T};let n=0;while(s.tod!=='${want}'&&n++<3)s.cycleTime();return s.tod})()`)}`;
const steps = ['wait:9000', `eval:${enc('__hb.state.seenIntro=true')}`, 'key:Space', 'wait:5000'];
const apple = S('apple'), stone = S('stone'), ob = plan.obstacles[0], paint = S('painting'), prints = S('prints');
const cat = plan.animals.town.find((a) => a.kind === 'cat');
// 1. a thought about a tree, by night
if (apple) steps.push(go(apple.x, apple.y + 1), 'wait:1500', 'key:t', 'wait:700', 'shot:01-thought-town');
// 1b. a double click on a thing two tiles away: the walk the first click started stops, and a thought
const scr = (x, y, scene = 'Town') => `(()=>{const s=__game.scene.getScene('${scene}'),c=s.cameras.main,k=__game.canvas.getBoundingClientRect().width/__game.scale.width;return [(${x}*16+8-c.worldView.x)*c.zoom*k,(${y}*16+8-c.worldView.y)*c.zoom*k]})()`;
const trig = plan.secrets.flatMap((q) => (q.prints || (q.x != null && !q.room && q.kind !== 'painting' ? [[q.x, q.y]] : [])));
const spot = (() => { for (let y = 2; y < c.H - 2; y++) for (let x = 2; x < c.W - 4; x++) if (c.walk(x, y) && c.reached(x, y) && c.walk(x + 1, y) && c.ter(x + 2, y) === 'T' && !c.target[c.I(x + 1, y)] && trig.every(([a, b]) => Math.abs(a - x) + Math.abs(b - y) > 4) && c.toLane[c.I(x, y)] <= 2) return [x, y]; return null; })();
const bubble = `eval:${enc("(()=>{const t=__game.scene.getScene('UI').__thought;return 'bubble: '+(t&&t.c?t.c.list[1].text:'none')})()")}`;
if (spot) steps.push(go(spot[0], spot[1], 'down'), 'wait:1500', `dbl:${enc(scr(spot[0] + 2, spot[1]))}`, 'wait:700', 'shot:01b-double-click', bubble, `eval:${enc(`(()=>{const s=${T};return 'after the double click on ${spot[0] + 2},${spot[1]} the player stands at '+s.player.tx+','+s.player.ty+' (was ${spot[0]},${spot[1]}) facing '+s.player.dir+', walking: '+s.nav.walking})()`)}`,
  // a single click on the same tree: the player walks up to it, as before (no thought)
  'wait:4500', go(spot[0] - 2, spot[1], 'down'), 'wait:800', `click:${enc(scr(spot[0] + 2, spot[1]))}`, 'wait:1500', bubble, `eval:${enc(`(()=>{const s=${T};return 'after a single click the player stands at '+s.player.tx+','+s.player.ty+' facing '+s.player.dir})()`)}`, go(apple.x, apple.y + 1));
// 2. walking under the apple tree: the apple falls (a secret found)
if (apple) steps.push('wait:3500', 'key:ArrowUp', 'wait:1400', 'shot:02-secret-apple');
// 3. an animal: the cat, then running away when approached
if (cat) { const [x, y] = cat.spots[1] || cat.spots[0], far = stand(x, y, 3.5, 5), close = stand(x, y, 1, 2); steps.push(tod('dusk'), `eval:${enc(`(()=>{const a=${T}.life.animals.list.find(a=>a.kind==='cat');a.spot=${cat.spots.indexOf(cat.spots[1] || cat.spots[0])};a.mode='idle';${T}.life.animals.place(a);a.s.setVisible(true);return 1})()`)}`, go(far[0], far[1]), 'wait:2200', 'shot:03-animal-cat', go(close[0], close[1]), 'wait:500', 'shot:04-animal-flees'); }
// the obstacle by day: what waits behind it can be seen
if (plan.obstacles[0]) { const o = plan.obstacles[0], f = stand(o.x, o.y, 2, 3); steps.push(tod('day'), go(f[0], f[1]), 'wait:1800', 'shot:05a-obstacle-day'); }
// 4. an obstacle: tried without the tool, then opened with it
if (ob) {
  const [sx, sy] = ob.stand, dir = sx < ob.x ? 'right' : sx > ob.x ? 'left' : sy < ob.y ? 'down' : 'up';
  steps.push(tod('night'), go(sx, sy, dir), 'wait:1500', 'key:Space', 'wait:800', 'shot:05-obstacle-closed');
  steps.push('wait:3500', `eval:${enc("__hb.give('" + { boulder: 'pickaxe', log: 'saw', thicket: 'shears', gate: 'key', hatch: 'key' }[ob.kind] + "')")}`, 'key:Space', 'wait:1200', 'shot:06-obstacle-opened');
}
// 5. the paw prints of the lantern cat
if (prints) { const [x, y] = prints.prints[0]; steps.push('wait:3000', go(x, y + 2), 'wait:1200', 'key:ArrowUp', 'wait:1000', 'shot:07-prints'); }
// 6. a thought indoors, and the locked little door
const cl = plan.closets[0], room = cl?.place || PLACES.find((p) => p.kind !== 'workshop' && p.kind !== 'museum').id;
steps.push('wait:3000', `eval:${enc(`(${T}.scene.start('Interior',{id:'${room}'}),1)`)}`, 'wait:2500');
steps.push(`eval:${enc("(()=>{const s=__game.scene.getScene('Interior');const L=s.room.layout;const it=L.items.find(i=>i.type!=='sig'&&i.type!=='pillar');s.player.tx=it.x;s.player.ty=it.y+1;s.player.place();s.player.face('up');s.life.think(it.x,it.y);return it.type})()")}`, 'wait:700', 'shot:08-thought-room');
if (cl) steps.push(`eval:${enc(`(()=>{const s=__game.scene.getScene('Interior');s.player.tx=${cl.stand[0]};s.player.ty=${cl.stand[1]};s.player.place();s.player.face('up');return 1})()`)}`, 'wait:3800', 'key:Space', 'wait:800', 'shot:09-locked-door');
// 7. a painting in large
if (paint) steps.push('wait:2500', `eval:${enc(`(()=>{const s=__game.scene.getScene('Interior');s.scene.start('Interior',{id:'${paint.place}'});return 1})()`)}`, 'wait:2500', `eval:${enc(`(()=>{const s=__game.scene.getScene('Interior');s.life.look(s.life.paintings[0]);return 1})()`)}`, 'wait:1200', 'shot:10-painting', 'key:Escape', 'wait:800');
// 8. the discoveries page
steps.push(`eval:${enc("(__game.scene.getScene('UI').page(()=>__hb.journal()),1)")}`, 'wait:1000', 'shot:11-discoveries', 'key:Escape', 'wait:500');
const r = spawnSync('node', [path.join(here, 'shoot.mjs'), path.join(here, '..', 'dist', 'index.html'), out, steps.join(',')], { stdio: 'inherit', env: { ...process.env, VP: PHONE ? '390x844x2' : '1440x800x1', Q: PHONE ? '?lite&test&touch&arrived' : '?lite&test&arrived' } });
if (process.env.OUT2) for (const f of readdirSync(out)) if (f.endsWith('.png')) copyFileSync(path.join(out, f), path.join(process.env.OUT2, `${PHONE ? 'life-phone' : 'life'}-${f}`));
console.log(`Pictures are in ${out}. Open them.`);
process.exit(r.status || 0);
