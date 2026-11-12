// Small animations for the reading pages, drawn in code. A page section refers to one with
// figure: { kind: 'animation', ref: '<name>' }. Each gets (g, seconds, canvas) for a 720 x 400 canvas.

export const ANIMS = {
  // three lamps drifting together and apart
  lamps(g, t) {
    g.fillStyle = '#000'; g.fillRect(0, 0, 720, 400);
    const k = (Math.sin(t * 0.7) + 1) / 2, d = 40 + k * 120;
    g.globalCompositeOperation = 'lighter';
    [['#ff0000', -90], ['#00ff00', 30], ['#0000ff', 150]].forEach(([c, a]) => { g.fillStyle = c; g.beginPath(); g.arc(360 + Math.cos(a * Math.PI / 180) * d, 200 + Math.sin(a * Math.PI / 180) * d, 110, 0, 7); g.fill(); });
    g.globalCompositeOperation = 'source-over';
  },
  inks(g, t) {
    g.fillStyle = '#fff'; g.fillRect(0, 0, 720, 400);
    const k = (Math.sin(t * 0.7) + 1) / 2, d = 40 + k * 120;
    g.globalCompositeOperation = 'multiply';
    [['#00ffff', -90], ['#ff00ff', 30], ['#ffff00', 150]].forEach(([c, a]) => { g.fillStyle = c; g.beginPath(); g.arc(360 + Math.cos(a * Math.PI / 180) * d, 200 + Math.sin(a * Math.PI / 180) * d, 110, 0, 7); g.fill(); });
    g.globalCompositeOperation = 'source-over';
  },
};
