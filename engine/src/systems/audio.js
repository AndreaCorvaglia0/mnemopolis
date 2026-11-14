// Synthesised sound, no audio files. The work is in systems/sound/ (see ENGINE.md, "Sound"):
//   theory.js  scales, the piece of a course, the planner of events (pure)
//   mix.js     game state -> levels of the layers; tiles -> place sounds (pure)
//   engine.js  the Web Audio graph: ambient bed, sparse notes, motif, place sounds, reverb
//   sfx.js     the short sound effects and the fire
//   index.js   the live context, the settings (moods), the game-state hooks
// This file keeps the names the scenes have always imported.
export { sound } from './sound/lab.js';
export { uiSound, ui } from './sound/index.js';
export { initAudio, toggleMute, setMusic, setMusicOn, duckMusic, setSea, setFire, setRain, sfx, moodSetting, setMood, cycleMood, currentMood } from './sound/index.js';
