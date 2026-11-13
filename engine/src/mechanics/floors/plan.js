// Upper floors: what a house keeps upstairs, as plain data. Pure, Node-safe (the room composer,
// the validator's tests and the scenes read it).
//
//   floorsOf(place)              { up, advanced, open, guarded, further, riddles: { up, room } }
//   fixturesOf(place, floor)     what the room composer must place on that floor: stairs, locks,
//                                the advanced lab door, the shelf of further reading
//   whereOf(riddle)              'upstairs' | 'room'
//   isGround(station)            a station of the ground-floor lab (not "advanced")
//
// A house has an upper floor when its concept has anything for it: an advanced station, a riddle
// that lives upstairs, or a "further" link; in the story, every core house (`attic`). Only houses drawn as composed rooms (not the workshop
// of a process, not the museum of a story) have floors: their stations and riddles stay where the
// scene can show them, and the validator warns.
import { LOCK_KINDS } from '../riddles/kinds.js';

export const isGround = (s) => !s?.advanced;
export const whereOf = (r) => (r?.where === 'room' ? 'room' : 'upstairs');
export const ROOM_SCENE = (place) => place.kind !== 'workshop' && place.kind !== 'museum';

export function floorsOf(place) {
  const stations = place?.lab?.stations || [], riddles = place?.riddles || [];
  const advanced = stations.filter((s) => s.advanced);
  const guarded = new Set(riddles.flatMap((r) => [].concat(r.inside?.station || [])));
  const up = riddles.filter((r) => whereOf(r) === 'upstairs'), room = riddles.filter((r) => whereOf(r) === 'room');
  const further = place?.further || [];
  return {
    // place.attic: the story gives every core house an upstairs for its memento (data/content.js)
    up: !!(advanced.length || up.length || further.length || place?.attic) && ROOM_SCENE(place || {}),
    advanced, open: advanced.filter((s) => !guarded.has(s.id)), guarded: [...guarded], further, riddles: { up, room },
  };
}

// lock -> the zone that carries it in a room (zones.js); unknown kinds fall back to the safe
const zoneOf = (r) => (LOCK_KINDS[r.kind] || LOCK_KINDS.safe).zone;

export function fixturesOf(place, floor = 'ground') {
  const f = floorsOf(place);
  if (floor === 'up') {
    if (!f.up) return null;
    return { floor: 'up', stairs: false, door: f.open.length > 0, shelf: f.further.length > 0, locks: f.riddles.up.map((r) => ({ id: r.id, kind: r.kind, zone: zoneOf(r) })) };
  }
  return { floor: 'ground', stairs: f.up, door: true, shelf: true, locks: f.riddles.room.map((r) => ({ id: r.id, kind: r.kind, zone: zoneOf(r) })) };
}
