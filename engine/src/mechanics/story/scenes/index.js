// The illustrated scenes of the story, by name (debug.js paints them alone: __hb.story.paint(name)).
import { harbourPainter } from './harbour.js';
import { objectPainter } from './objects.js';
import { lampRoomPainter, registerPainter, pagesPainter, gangwayPainter } from './ending.js';

export const PAINTERS = {
  harbour: harbourPainter, lamproom: lampRoomPainter, register: registerPainter, pages: pagesPainter, gangway: gangwayPainter,
  ...Object.fromEntries(['page', 'ticket', 'flower', 'photo', 'drawing', 'letter', 'watch', 'card', 'notebook', 'leaf'].map((k) => [k, () => objectPainter(k)])),
};
