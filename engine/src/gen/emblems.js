// Emblems: one small pixel icon per concept (optional "emblem" in course.json), shown on the
// house sign and inside its room. Each icon is drawn on a 9 x 9 grid.
// drawEmblem(ctx, name, x, y, scale, colour) draws nothing for an unknown name.
const ICONS = {
  star: ['....#....', '....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.#.....#.'],
  drop: ['....#....', '....#....', '...###...', '...###...', '..#####..', '.#######.', '.#######.', '.#######.', '..#####..'],
};
export const EMBLEMS = Object.keys(ICONS);
export function drawEmblem(ctx, name, x, y, scale = 1, colour = '#ffffff') {
  const rows = ICONS[name];
  if (!rows) return false;
  ctx.fillStyle = colour;
  rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') ctx.fillRect(x + i * scale, y + j * scale, scale, scale); }));
  return true;
}
