// What kind of thing is at a tile, from data the town and the rooms already have (terrain, props,
// dressing pieces, room furniture and wall decorations). No sprite is tagged one by one.
//   townThingAt(c, plan, x, y)   c = lifeContext of the town, plan = the life plan
//   roomThingAt(L, x, y, extra)  L = a composed room (gen/interior), or null for the standard room
// Both return { kind, point } (point: the thing has a function of its own) or { obstacle } or null.
import { LINES } from './lines.js';

const PIECE = {
  fence: 'fence', flowerbed: 'flowers', border: 'flowers', planter: 'flowers', topiary: 'bush', birdbath: 'birdbath', fruittree: 'fruittree',
  beehive: 'beehive', scarecrow: 'scarecrow', barrels: 'barrel', crates: 'crates', woodpile: 'woodpile', nets: 'nets', laundry: 'laundry', sledge: 'sledge',
  lantern: 'lamp', fir: 'fir', statue: 'statue', well: 'well', stall: 'stall', bench: 'bench', pier: 'jetty', boat: 'boat', reeds: 'reeds', lily: 'water',
  kerb: 'plaza', steps: 'path', beans: 'garden',
};
const BED = { cabbage: 'garden', carrot: 'garden', beans: 'garden', soil: 'garden', bloom0: 'flowers', bloom1: 'flowers', bloom2: 'flowers', lawn: 'grass', scarecrow: 'scarecrow', barrels: 'barrel', birdbath: 'birdbath', topiary: 'bush' };
const TERRAIN = { T: 'tree', b: 'bush', F: 'fence', '~': 'water', w: 'bridge', R: 'cliff', e: 'cliff', r: 'rock', s: 'sand', G: 'tallgrass', f: 'flowers', g: 'grass', p: 'path', c: 'plaza', d: 'sand' };
const PROP = { bench: 'bench', boulder: 'rock', crate: 'crates', boat: 'boat' };
const thing = (kind) => (kind ? { kind, point: !!LINES[kind]?.point } : null);

export function townThingAt(c, plan, x, y) {
  if (!c.inMap(x, y)) return null;
  const t = c.town, at = ([a, b]) => a === x && b === y;
  if (t.NPCS.some((n) => n.x === x && n.y === y)) return thing('person');
  const ob = plan?.obstacles.find((o) => o.tiles.some(at));
  if (ob) return { obstacle: ob, kind: 'obstacle', point: true };
  if (plan?.obstacles.some((o) => o.ring.some(at))) return thing('bush');
  const b = c.building(x, y);
  if (b) {
    if (b.home) return thing('closedhouse');
    if (b.doors.some(at)) return thing('door');
    return thing(y - b.y < 2 ? 'roof' : 'house');
  }
  if (t.SIGNS.some((s) => s.x === x && s.y === y)) return thing('sign');
  if (t.MONUMENTS.some((m) => m.y === y && (m.x === x || m.x + 1 === x))) return thing('landmark');
  if (t.LAMPS.some(at)) return thing('lamp');
  const pr = t.PROPS.find(at);
  if (pr) return thing(PROP[pr[2]] || 'rock');
  const p = c.piece.get(`${x},${y}`);
  if (p && (p.solid || p.t === 'pier' || p.t === 'boat' || p.t === 'reeds' || p.t === 'lily' || p.t === 'border')) return thing(p.t === 'bed' ? BED[p.bed] || 'garden' : PIECE[p.t] || 'grass');
  return thing(TERRAIN[c.ter(x, y)] || 'grass');
}

const ITEM = {
  chair: 'chair', stool: 'chair', armchair: 'chair', pew: 'chair',
  desk: 'table', readtable: 'table', longtable: 'table', worktable: 'table', charttable: 'table', labtable: 'table', examtable: 'table', bench: 'table', painttable: 'table', clockbench: 'table', pottingbench: 'table', sidetable: 'table',
  shelf: 'shelf', shelf1: 'shelf', cabinet: 'shelf', drawers: 'shelf', planchest: 'shelf', lamp: 'desklamp', candelabra: 'desklamp', plant: 'plant', planter: 'plant',
  range: 'stove', kiln: 'stove', vat: 'vat', rack: 'loom', loom: 'loom', piano: 'instrument', harp: 'instrument', musicstand: 'instrument', globe: 'globe', scope: 'telescope',
  easel: 'easel', canvases: 'easel', chest: 'chest', basket: 'chest', papers: 'chest', computer: 'computer', screen: 'screen', lectern: 'lectern', wheel: 'wheel',
  rock: 'rock', rock2: 'rock', stalagmite: 'rock', crystal: 'crystal', pillar: 'pillar', sig: 'signature',
};
const WALL = { window: 'window', portrait: 'picture', landscape: 'picture', botanical: 'picture', map: 'picture', starchart: 'picture', chart: 'poster', poster: 'poster', sheet: 'poster', lightbox: 'poster', clock: 'clock', banner: 'banner', cloth: 'cloth', cloths: 'cloth', pans: 'kitchen', plate: 'kitchen', herbs: 'kitchen' };

// extra: { master: [x, y], exit, lab, exhibit: [[x, y]], closets: [obstacle], paintings: [secret] }
export function roomThingAt(L, x, y, extra = {}) {
  const at = (p) => p && p[0] === x && p[1] === y;
  if (at(extra.master)) return thing('host');
  if (at(extra.exit)) return thing('exit');
  const cl = (extra.closets || []).find((o) => o.x === x && y <= o.y && y >= o.top);
  if (cl) return { obstacle: cl, kind: 'obstacle', point: true };
  if (!L) { // the standard room
    if (at(extra.lab) || (extra.lab && x === extra.lab[0] && y <= extra.lab[1])) return thing('labdoor');
    if ((extra.exhibit || []).some(at) || (y <= 2 && x >= 2 && x <= 4)) return thing('board');
    return thing(y <= 2 ? 'poster' : 'floor');
  }
  const top = L.top[x] ?? 0;
  if (x === L.lab[0] && y >= top && y <= top + 2) return thing('labdoor');
  if ((L.exhibit || []).some(at) || (L.board && y < top + 3 && x >= L.board.x0 && x < L.board.x0 + L.board.n)) return thing('board');
  const pa = (extra.paintings || []).find((s) => y < top + 3 && x >= s.x && x < s.x + (s.n || 1));
  if (pa) return { kind: 'picture', painting: pa, point: false };
  if (y < top + 3) {
    const d = L.wall.find((o) => x >= o.x && x < o.x + o.n);
    if (d) return thing(WALL[d.type] || 'picture');
    if (L.torches?.some(([tx]) => Math.floor(tx / 16) === x)) return thing('torch');
    return null;
  }
  const it = L.items.find((o) => y === o.y && x >= o.x && x < o.x + o.fw);
  if (it) return thing(it.type === 'shelf' || it.type === 'shelf1' ? (it.opt?.fill === 'books' ? 'books' : 'shelf') : ITEM[it.type] || 'chest');
  if (L.rugs.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h)) return thing('rug');
  return thing('floor');
}
