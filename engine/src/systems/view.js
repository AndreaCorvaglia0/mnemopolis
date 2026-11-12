// Screen rules shared by the scenes.
const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();

// How much of the town fits on screen. The SHORT side of the screen shows about TILES tiles, in
// portrait and in landscape, on a phone and on a monitor; the long side shows what follows from
// the shape of the screen. The zoom is a whole number so that pixel art stays sharp.
// Try other values with ?tiles=N in the address.
export const TILES = Number(q.get('tiles')) || 14;
export function townZoom(W, H) {
  const s = Math.min(W, H), l = Math.max(W, H);
  return Math.max(1, Math.round(Math.min(s / (TILES * 16), l / (TILES * 16 * 1.45))));
}

// Touch mode: on for phones and tablets, and as soon as a finger touches the screen anywhere.
// ?touch in the address forces it, to test on a computer.
export const touch = { on: q.has('touch') || (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) };
if (typeof window !== 'undefined') window.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch' && !touch.on) { touch.on = true; window.dispatchEvent(new Event('touchmode')); }
}, true);
