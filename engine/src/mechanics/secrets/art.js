// Small things of the secrets, drawn in code: an apple, a bottle, glowing paw prints, the hole of a
// hollow tree, a folded note, the lantern of the lantern cat.
import { makeCanvas, rect, px, ellipse } from '../../art/px.js';

const INK = '#1b1a2b';
export const SECRET_ART = {
  apple(ctx) { ellipse(ctx, 3, 3, 3, 3, INK); ellipse(ctx, 3, 3, 2, 2, '#d9443a'); px(ctx, 2, 2, '#ff9a8a'); px(ctx, 3, 0, '#5e3e27'); px(ctx, 4, 0, '#4f9447'); },
  bottle(ctx) { rect(ctx, 0, 1, 7, 4, INK); rect(ctx, 1, 2, 5, 2, '#7fc4a8'); rect(ctx, 7, 2, 2, 2, INK); px(ctx, 8, 2, '#b07a4f'); rect(ctx, 2, 2, 2, 1, '#f3efe4'); px(ctx, 1, 2, '#c8f0e0'); },
  prints(ctx) { for (const [x, y] of [[2, 12], [6, 9], [3, 6], [8, 3], [11, 7], [13, 2]]) { rect(ctx, x, y, 2, 2, '#ffd86a'); px(ctx, x - 1, y - 1, '#ffd86a'); px(ctx, x + 2, y - 1, '#ffd86a'); px(ctx, x + 1, y - 2, '#ffd86a'); } },
  muddy(ctx) { for (const [x, y] of [[2, 12], [6, 9], [3, 6], [8, 3], [11, 7], [13, 2]]) { rect(ctx, x, y, 2, 2, '#6b5038'); px(ctx, x - 1, y - 1, '#6b5038'); px(ctx, x + 2, y - 1, '#6b5038'); px(ctx, x + 1, y - 2, '#6b5038'); } },
  hollow(ctx) { ellipse(ctx, 2, 3, 2, 3, INK); ellipse(ctx, 2, 3, 1, 2, '#0d0b14'); px(ctx, 1, 1, '#7a5a3a'); },
  note(ctx) { rect(ctx, 3, 4, 1, 6, '#5e3e27'); rect(ctx, 0, 0, 8, 6, INK); rect(ctx, 1, 1, 6, 4, '#f3efe4'); rect(ctx, 2, 2, 4, 1, '#9a948a'); rect(ctx, 2, 3, 3, 1, '#9a948a'); px(ctx, 3, 1, '#d4553f'); },
  lantern(ctx) { rect(ctx, 1, 0, 3, 1, INK); rect(ctx, 0, 1, 5, 6, INK); rect(ctx, 1, 2, 3, 4, '#ffd86a'); px(ctx, 1, 2, '#fff6c8'); rect(ctx, 2, -1, 1, 1, INK); },
  star(ctx) { rect(ctx, 0, 0, 2, 2, '#ffffff'); },
};
const SIZE = { apple: [7, 7], bottle: [10, 6], prints: [16, 16], muddy: [16, 16], hollow: [5, 7], note: [8, 10], lantern: [5, 8], star: [2, 2] };
export function secretTexture(name) { const [w, h] = SIZE[name], [c, ctx] = makeCanvas(w, h); ctx.translate(0, name === 'lantern' ? 1 : 0); SECRET_ART[name](ctx); return c; }
