// Reading pages. The frame (concept, idea, anchor, "explain it yourself", "remember") is built from
// course.js; here goes only the middle: two to four short sections. Keep each under ~120 words.
// A figure can be an animation drawn in code: <canvas data-anim="name" width="720" height="400"> + ANIMS.name.

const anim = (id, cap) => `<figure><canvas data-anim="${id}" width="720" height="400"></canvas><figcaption>${cap}</figcaption></figure>`;

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

export const PAGES = {
  lamps: { html: `
    <h3>Lights add</h3>
    <p>Shine a red lamp on a wall and the wall sends red light to your eye. Add a green lamp and it sends red and green together. Nothing is taken away, so two lamps are always brighter than one.</p>
    ${anim('lamps', 'Three lamps drifting together. Where all three overlap the wall is white.')}
    <h3>A pixel is three lamps</h3>
    <p>Look at a screen through a magnifying glass and every pixel splits into a red, a green and a blue stripe. Each has a brightness from 0 to 255. From normal distance the eye cannot separate them and sees their sum.</p>` },
  print: { html: `
    <h3>Ink takes away</h3>
    <p>Paper has no lamps. It is white because it reflects all the light that falls on it. An ink is a filter: cyan ink absorbs red light and lets green and blue come back.</p>
    ${anim('inks', 'Three inks drifting together. Where all three overlap, no light comes back.')}
    <h3>Why not red, green and blue inks?</h3>
    <p>A red ink absorbs green and blue: two thirds of the light at once. Put green ink on top and nothing is left. Cyan, magenta and yellow each remove only one third, so they can be combined.</p>
    <h3>Tone from dots</h3>
    <p>A printer either puts ink on a spot or does not. Light and dark come from the size of the dots, which the eye averages from reading distance.</p>` },
  wheel: { html: `
    <h3>Three dials</h3>
    <p>Nobody says "a bit more 214, 96, 30". People say "more orange", "less vivid", "lighter". Hue, saturation and lightness turn those words into dials.</p>
    <h3>The same colours</h3>
    <p>HSL does not add any colour to RGB. It is a different set of coordinates for the same points, the way a town can be described by street addresses or by walking directions.</p>` },
  context: { html: `
    <h3>The eye compares</h3>
    <p>The eye evolved to recognise surfaces under changing light, not to measure light. It judges every patch against its neighbours. A grey patch on black looks light; the same patch on white looks dark.</p>
    <h3>Why it matters</h3>
    <p>Pick colours on the background they will live on. Two charts with different backgrounds can make the same value look different, and equal numbers in a file are no promise of equal appearance.</p>` },
  cones: { html: `
    <h3>Three kinds of cone</h3>
    <p>The retina has three kinds of colour receptor. Each answers to a broad range of wavelengths, most strongly to long, medium or short ones. A light, however complex, leaves the eye as three signals.</p>
    <h3>Different lights, same signals</h3>
    <p>Pure yellow light excites the long and medium cones together. So does a mix of red and green light, in the right proportion. The brain receives the same three signals and cannot tell them apart.</p>` },
};
