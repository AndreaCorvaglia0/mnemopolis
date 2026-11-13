// Contact sheets of rooms, for looking at the generator (__hb.rooms() in the browser console;
// saved by the screenshot tour). Each room is painted as the scene would paint it: background,
// furniture sorted by depth, the host. No lights.
// rooms(list?, { cols, scale, gen }) shows `list` (places, default: SAMPLE plus the course's rooms).
export const SAMPLE = [
  { id: 'smp-lab', kind: 'lab', order: 2, concept: 'Feedback loops', emblem: 'gear' },
  { id: 'smp-archive', kind: 'archive', order: 3, concept: 'Parts of a cell' },
  { id: 'smp-hall', kind: 'hall', order: 4, concept: 'Which test when', emblem: 'scale' },
  { id: 'smp-studio', kind: 'studio', order: 5, concept: 'Reading real scans' },
  { id: 'smp-obs', kind: 'observatory', order: 6, concept: 'Ways of measuring', emblem: 'eye' },
  { id: 'smp-cave', kind: 'cave', order: 7, concept: 'Why it works' },
  { id: 'smp-archive2', kind: 'archive', order: 1, concept: 'Names and formats', emblem: 'book' },
  { id: 'smp-hall2', kind: 'hall', order: 8, concept: 'Trade-offs' },
];
// homes of experts, one per trade, in the three themes
export const HOMES = ['cartographer', 'dyer', 'cook', 'musician', 'gardener', 'clockmaker', 'doctor', 'painter', 'scholar', 'potter', 'weaver', 'printer'].map((trade, i) => (
  { id: `home-${trade}`, kind: 'home', trade, order: (i % 8) + 1, concept: `The ${trade}'s view`, theme: ['harbour', 'nordic', 'citadel'][i % 3], host: { look: { cartographer: 'surveyor', dyer: 'dyer', cook: 'cook', musician: 'musician', gardener: 'gardener', clockmaker: 'maker', doctor: 'doctor', painter: 'painter', scholar: 'archivist', potter: 'maker', weaver: 'weaver', printer: 'tech' }[trade] } }));

export function roomSheet(game, gen, places, { cols = 4, scale = 2, title = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:60;background:#14131f;display:flex;flex-wrap:wrap;gap:10px 14px;align-content:flex-start;justify-content:center;padding:10px;font:12px system-ui;color:#ddd;overflow:auto';
  if (title) { const h = document.createElement('div'); h.style.cssText = 'width:100%;text-align:center;font-size:15px'; h.textContent = title; wrap.append(h); }
  for (const place of places) {
    let room;
    try { room = gen(place); } catch (e) { const d = document.createElement('div'); d.textContent = `${place.id}: ${e.message}`; wrap.append(d); continue; }
    const W = room.w * 16, H = room.h * 16, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0d0f1e'; ctx.fillRect(0, 0, W, H);
    room.paint(ctx);
    const items = room.props.map((p) => ({ depth: p.depth, draw: () => { const c = document.createElement('canvas'); c.width = p.w; c.height = p.h; p.paint(c.getContext('2d')); ctx.drawImage(c, p.x, p.y); } }));
    const look = place.host?.look || 'tech', tex = game.textures.exists(`ch-${look}`) ? game.textures.get(`ch-${look}`).getSourceImage() : null;
    if (tex) { const [mx, my] = room.master; items.push({ depth: (my + 1) * 16 - 1, draw: () => ctx.drawImage(tex, 0, 0, 16, 24, mx * 16, my * 16 - 8, 16, 24) }); }
    items.sort((a, b) => a.depth - b.depth).forEach((i) => i.draw());
    if (room.dark) { ctx.fillStyle = 'rgba(10,8,20,0.25)'; ctx.fillRect(0, 0, W, H); }
    const d = document.createElement('div'); d.style.textAlign = 'center';
    cv.style.cssText = `width:${W * scale}px;image-rendering:pixelated;display:block;margin:0 auto 3px`;
    d.append(cv, `${place.id} · ${place.kind}${place.trade ? ` · ${place.trade}` : ''} · ${room.plan || 'standard'} ${room.w}x${room.h}`);
    wrap.append(d);
  }
  wrap.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  document.body.append(wrap);
  return 1;
}
