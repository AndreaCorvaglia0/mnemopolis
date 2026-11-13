import Phaser from 'phaser';
import { paintGround } from '../art/ground.js';
import { makeWorldSprites, makeCharacter, LOOKS } from '../art/sprites.js';
import { makeBuildings } from '../art/buildings.js';
import { addTex } from '../art/px.js';
import { BUILDINGS } from '../world/townMap.js';
import { load, state } from '../systems/state.js';
import { setMusicOn } from '../systems/audio.js';

import { COURSE } from '../course/course.js';
import { w } from '../data/words.js';

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const k = Math.min(this.scale.width / 960, this.scale.height / 540);
    const t = this.add.text(this.scale.width / 2, this.scale.height / 2, w('ui.loading', { title: COURSE.title }), { fontFamily: 'monospace', fontSize: `${Math.round(18 * k)}px`, color: '#e9e2c9' }).setOrigin(0.5);
    this.time.delayedCall(30, async () => {
      load();
      setMusicOn(!state.musicOff);
      const g = paintGround();
      addTex(this, 'ground', g.canvas);
      addTex(this, 'foam-0', g.foam[0]);
      addTex(this, 'foam-1', g.foam[1]);
      this.registry.set('sparkles', g.sparkles);
      makeWorldSprites(this);
      for (const [key, look] of Object.entries(LOOKS)) makeCharacter(this, `ch-${key}`, look);
      this.registry.set('buildings', makeBuildings(this, BUILDINGS));
      try { await document.fonts.load('20px "Pixelify Sans"'); await document.fonts.load('600 20px "Pixelify Sans"'); await document.fonts.load('20px "DotGothic16"'); } catch (e) { /* fall back */ }
      t.destroy();
      this.scene.start('Town');
      this.scene.launch('UI');
    });
  }
}
