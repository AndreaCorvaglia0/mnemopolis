// A very small tiled Wave Function Collapse for the patterned parts of the dressing (the beds inside
// a garden plot). No library: every cell starts with every tile allowed, the cell with the fewest
// choices left is collapsed (weighted, seeded), and the choice is propagated to the neighbours by
// an adjacency rule. A contradiction restarts the fill; after a few restarts it gives up (null).
//
//   wfc(cells, tiles, ok, r)
//     cells  [[x, y], ...]             any shape, not only rectangles
//     tiles  [{ id, w, once }]         w = weight; once = at most one in the whole fill
//     ok     (a, b, dx, dy) => bool    may tile a stand at p while tile b stands at p + (dx, dy)?
//     r      seeded() random source
//   returns Map("x,y" -> tile id) or null
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function wfc(cells, tiles, ok, r, tries = 12) {
  const key = (x, y) => `${x},${y}`, here = new Set(cells.map(([x, y]) => key(x, y)));
  for (let t = 0; t < tries; t++) {
    const dom = new Map(cells.map(([x, y]) => [key(x, y), tiles.map((_, i) => i)]));
    const prune = (stack) => { // arc consistency: drop every tile that no tile of a neighbour supports
      while (stack.length) {
        const [x, y] = stack.pop(), A = dom.get(key(x, y));
        for (const [dx, dy] of N4) {
          const k = key(x + dx, y + dy);
          if (!here.has(k)) continue;
          const B = dom.get(k), keep = B.filter((b) => A.some((a) => ok(tiles[a].id, tiles[b].id, dx, dy)));
          if (!keep.length) return false;
          if (keep.length < B.length) { dom.set(k, keep); stack.push([x + dx, y + dy]); }
        }
      }
      return true;
    };
    let alive = true;
    for (;;) {
      let best = null;
      for (const [x, y] of cells) { const n = dom.get(key(x, y)).length; if (n > 1 && (!best || n < best.n || (n === best.n && r() < 0.3))) best = { x, y, n }; }
      if (!best) break;
      const D = dom.get(key(best.x, best.y)), sum = D.reduce((s, i) => s + tiles[i].w, 0);
      let pick = r() * sum, c = D[0];
      for (const i of D) { pick -= tiles[i].w; if (pick <= 0) { c = i; break; } }
      dom.set(key(best.x, best.y), [c]);
      const stack = [[best.x, best.y]];
      if (tiles[c].once) for (const [x, y] of cells) { // a "once" tile leaves every other cell
        const k = key(x, y);
        if (x === best.x && y === best.y) continue;
        const D2 = dom.get(k).filter((i) => i !== c);
        if (!D2.length) { alive = false; break; }
        if (D2.length < dom.get(k).length) { dom.set(k, D2); stack.push([x, y]); }
      }
      if (!alive || !prune(stack)) { alive = false; break; }
    }
    if (alive) return new Map([...dom].map(([k, D]) => [k, tiles[D[0]].id]));
  }
  return null;
}
