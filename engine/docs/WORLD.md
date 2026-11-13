# The town: a memory palace with rules

The method of loci works when places are **distinct**, **ordered** and **stable**. The town is
generated from the course so that these three hold by construction. Nobody places tiles by hand.

## What each element means

| In the town | In the course | Rule |
|---|---|---|
| The central square, with a monument | The subject as a whole; the big idea | Reading the monument shows the big idea |
| A district: a small plaza with houses around it, in its own landscape | One theme | 1 to 4 districts, each with a different landscape |
| The landscape (river, shore, forest, meadow, hill) | A visual cue for the theme | The district sits across the river, on a rocky rise, in a grove, among fenced flower fields, or beside a pond |
| The district plaza and its landmark | The idea of the theme | Reading the landmark shows the district idea and its houses |
| A winding lane from the square | "Start from the big idea" | Districts go clockwise from the west, in learning order, each a few seconds' walk away |
| The river | A landmark for orientation | Always present: it winds between the square and one district, with a bridge and a pond at each end |
| A house | One concept | 1 to 4 per district, numbered in learning order; the number is on the wall |
| The shape of the house | The kind of knowledge inside | See the table below |
| Position around the plaza | The order of the concepts | Two houses above the plaza, then two below; left before right |
| A signpost by each door | Name, concept, objective | Generated |
| Tall grass (review meadows) | Retrieval practice | Quick questions on houses already visited; optional; G switches them off |
| The league hall, on the square | The final check | Questions of level 2 and 3 from every house |
| The corner of the screen | "Where am I in the outline?" | Always shows the district |
| The map (Tab) | The mind map | Same structure as the town: big idea, districts, houses, progress |

## Kinds of building

| `kind` | Looks like | For | Room inside |
|---|---|---|---|
| `lab` | A purple roof with a wire cube | A mechanism | Standard room: lab door, reading wall, host |
| `archive` | A cream building with columns | Parts, names, formats | Standard room |
| `hall` | A brick hall with a balance on the roof | A choice between options | Standard room |
| `studio` | A white building with a ring on the roof | Practice on real cases | Standard room |
| `observatory` | A striped tower with a light | A way of seeing or measuring | Standard room |
| `cave` | A cave mouth with lanterns | An optional deep dive | Torch-lit room |
| `workshop` | A factory with a saw-tooth roof | A process in steps | A conveyor belt; each lab station is a machine (up to 8) |
| `museum` | A castle | A story in time | A torch-lit corridor; one plaque per event, oldest on the left |
| `home` | A private house with a name plate and a trade sign | A concept explained by a person (an `expert`) | The expert's room, furnished for their trade; they are the host |

`npm run shots` saves a picture of every kind of building and landmark (`shots/99-gallery.png`).

Every standard room is the same on purpose: the lab door glows on the left, the reading wall is
next to it, the host stands in the middle. Colour and floor change with the kind. The learner
learns the room once.

**The principle of the look: outside is generated with irregularity, inside is composed.** The
town is varied and natural: lanes wind, houses differ, gardens and groves grow where they fit.
Rooms are the opposite: a grid, an axis, groups of furniture and order, so that each room tells at
a glance what it is for and nothing lies around at random.

## Landscapes and landmarks

Landscapes (`nature`): `river` (the district lies across the river), `shore` (a pond with a sandy
edge beside it), `forest` (a grove around it), `meadow` (flower fields and stretches of fence),
`hill` (a rocky rise).

The town is compact on purpose. `npm run check` reports the walking distance from the square to
the farthest door and warns above 45 steps. Night is the default time of day (N changes it).

**Nothing stands in front of a door.** For every door (houses, the guide's house, the league hall): the
tile below it, the 3 tiles below the door row (and their neighbours) and the two rows in front of the facade
are free of anything solid except the house's own signpost, and the tile below the door can be reached on foot
from the start. `generate()` in `src/world/townMap.js` reserves these tiles before landscapes, lamps, signs,
benches, trees and bushes are placed, and the dressing keeps off them. `npm run check` tests it for the course
(`door approach`, `src/world/doors.js`); `npm run stress` tests it on hundreds of synthetic towns.

Landmarks (`landmark`, and `hub.monument`): `fountain`, `obelisk`, `statue`, `arch`, `bell`,
`stones`. Each can be used once.

Choose them for meaning where an honest link exists, otherwise simply for variety. Tell the
learner the link in the district's `idea` or in the guide's lines if there is one.

## Generated houses

On by default (`GEN.facade`, `src/gen/facade.js`). Every house is put together at boot from
hand-drawn pieces, in three passes: massing (the shape of the kind, storeys, roof type), facade
(walls, bays, door, sign) and details (shutters, flower boxes, awnings, chimneys, lamps, emblem).
It is deterministic: the seed is `<course id>:<house id>:facade`, so the same course always gives
the same town and another course a different one.

| Stays (it tells the learner the kind) | Varies |
|---|---|
| The silhouette of each kind: the lab's cube on the roof, the hall's balance board, the studio's ring and flat roof, the archive's columns and pediment, the observatory's tower and light, the workshop's saw-tooth roof and chimneys, the museum's castle, the cave's mouth, the league's star | Roof type and colour, storeys, window shape and arrangement, door style, chimney, porch or awning, shutters, flower boxes, vines, wall material, column count, tooth count, tower bands and cap, banners, crystals... |
| Footprint, door tile, house number, the name sign | |

- **Districts**: the houses of one district share a roof colour family; each house is one step
  lighter or darker, has its own wall colour and one strong feature (shutters, flower boxes,
  awning, vines...) chosen by its place in the district, so two of them never look alike.
- **Themes** (`THEMES` in `src/gen/core.js`, chosen by `"theme"` in `world.json`, otherwise by
  the course id) change structure, not only colour: `harbour` has clapboard walls, tiled roofs of
  middle pitch and shutters; `nordic` painted board walls, steep slate roofs with front gables and
  tall windows; `citadel` ashlar walls with quoins, low hip, flat or mansard roofs and arched
  windows. The fields under `style` are read by the generator.
- **Emblems**: `"emblem"` on a concept in `course.json` puts a 9 x 9 icon on the sign, a gable or
  a tower. The names are in `src/gen/emblems.js` (`__hb.gallery()` shows them all); the validator
  warns on an unknown name.

`__hb.gallery()` (saved by `npm run shots` as `99-gallery.png`) shows every kind in the three
themes with two seeds, and four houses of one district; `__hb.gallery({ scale: 2 })` is bigger.

- **Switch off**: `{ "gen": { "facade": false } }` in `courses/<slug>/world.json`. The town is then
  drawn by the hand-written painters of `src/art/buildings.js`, exactly as before.
- **Add a theme**: a new entry in `THEMES` with the same fields as the others, including
  `hubRoof` and `style` (`pitch` 0 to 1, `roofs`, `tex`, `wall`, `windows`, `doors`, `shutters`,
  `chimney`, `boxes`, `awning`, `quoins`, `tower`, `cap`, `castle`).
- **Add a roof style**: a branch in `roof()` in `src/gen/facade.js` that fills its box and
  returns where a mark fits (`cx`, `cy`); then name it in a theme's `style.roofs`.
- **Add an emblem**: nine strings of nine characters in `ICONS` in `src/gen/emblems.js`. Keep it
  bold and filled: it is read at one pixel per cell.

## Standard look or custom look

**Standard (default).** Everything above, generated. Names, texts, landscapes, landmarks, kinds
of building, hosts' appearance (`look`) and the course itself are yours to set in `course.js`.
This is already a complete, coherent world, and it is where the effort should go first.

**Custom (costs more).** Possible, in rising order of cost:

1. A colour mood: edit `src/art/palette.js` (roofs, walls, grass, water).
2. New characters: add an entry to `LOOKS` in `src/art/sprites.js` (hair, clothes, style).
3. A new landmark: add a painter to `MONUMENTS` in `src/art/sprites.js` (32 × 48 pixels, drawn
   with rectangles and ellipses) and its name to `scripts/check.mjs`.
4. A new kind of building: a painter in `src/art/buildings.js`, an entry in `KINDS` in
   `src/world/townMap.js`, a theme in `THEME` in `src/scenes/Interior.js`, a room profile in
   `KINDS` in `src/gen/interior/kinds.js`.
5. A new landscape: a rule in `generate()` in `src/world/townMap.js`, and possibly new
   ground painting in `src/art/ground.js`.
6. Music: tracks are chord lists in `src/systems/audio.js`.

Offer the custom look as a second step, after the course works. Pixel art drawn in code takes
several rounds of screenshots to get right.

## What not to change

- The limits (4 districts, 4 houses each). They are what keeps the town in one head.
- The sameness of what the learner uses in a room (lab door, reading wall, host, exit) and of the
  lab frame.
- The rule that everything is generated from `course.js`. A hand-placed exception breaks the
  correspondence between town and map.

## Generated rooms

Optional, on by default: `src/gen/interior/` composes a different room for every house, the same
on every build (seeded by the course id and the house id). Switch it off in
`courses/<slug>/world.json` with `{ "gen": { "interior": false } }`: every house then gets the
standard room described above, unchanged.

**What stays, in every room:** the lab door (wooden, glowing, labelled LAB), the reading wall (a
board over a desk; the player reads it from the tile in front of the desk), the host, the exit mat
in the front wall with the entrance just above it, the concept written on the back wall and the
gold house number. Their place changes with the plan; their look does not.

**How a room is composed** (`compose.js`), in this order:

1. A **plan** (`plans.js`): `hall` wide and low, `square` compact, `ell` with a corner cut away
   (the back wall steps forward, or a small courtyard garden takes the front corner), `alcove` with
   a recess, `dais` with a raised platform, `nave` with a pair of pillars. 11 to 16 tiles wide and
   9 to 12 high, so a phone held upright keeps zoom 3. Nothing inside the room's box is left as
   dark empty space: above a lower back wall the wall goes on up, a front notch is a garden.
   Neighbouring houses never share a plan.
2. The **axis**, from the exit straight up to the back wall, kept free as an aisle; at its end the
   **focal point**: the signature object on a plinth (in the alcove, on the dais), and the concept's
   name centred above it.
3. The **learning wall** on one side of the focal point: lab door and reading wall together.
4. The **back zone** on the other side, mirroring the learning wall's span.
5. The **host** beside the aisle, on the learning side (on the dais, one tile from the signature).
6. One or two **floor zones**, one in each half of the room, the second placed as the mirror of the
   first; a free-standing group keeps a walkway all around it.
7. **Decorations** in mirrored pairs: plants in the front corners, a pair flanking the signature,
   windows and pictures on the back wall, torches in a cave.

A **zone** (`zones.js`) is a small hand-designed group with fixed relative positions: desk, chair
and lamp; two armchairs and a small table on a rug; shelves with a ladder; a bench with its stool;
three dye vats under hanging cloth. The generator chooses which zones (by kind of building or by
the expert's trade), their variant, and where they stand (against the back wall, a side wall, or
free on the floor), never single stray objects. Materials come from the project's `THEME` (wood,
stone, accent, wall tone) and the kind's own colours, so the rooms of one course belong together.

**The rules** (`rules.js`, pure functions returning a list of problems):

| Rule | What it checks |
|---|---|
| reachable | the entrance, the lab door, every reading-wall tile and the host are reached on foot from the exit; no free tile is cut off |
| tall | furniture taller than 27 px stands against a wall |
| focal | exactly one focal point, on the axis or in the alcove or on the dais, against the back wall |
| rug | a rug lies only under a group of two or more pieces |
| free | at least 55% of the floor tiles stay free |
| caps | 2 zones, 3 from 70 floor tiles; one decoration per 12 floor tiles |
| isolated | a piece away from the walls has a neighbour from its own group |
| rhythm | decorations come in pairs mirrored about the axis, or alone on it |
| palette | materials from the project theme plus one accent; pieces are tinted by palette names only |

A room that breaks a rule is composed again with the next seed, then on the next plan, then on
the plain hall. `npm run check` (part of the build) checks the course's rooms; `npm test` checks
several hundred rooms over every kind, trade, plan and theme.

**Stairs and locks** (`mechanics/floors/`, `mechanics/riddles/`). A house whose concept has
something for upstairs gets a **staircase**; a lock with `"where": "room"` stands on the ground
floor. Both are **fixtures**: small groups in `zones.js` (`stairs`, `vault` for a safe, `terminal`
for a desk with a computer, `hatch` for a door with a sliding hatch), placed in step 4a, after the
host and before the back zone, against the back wall with the tile in front kept free: the stairs
at the far end of the side opposite the learning wall, a lock near the middle of what is left. They
do not count as furniture groups for the caps, and the reachability rule checks that each one can
be used from the tile in front. A house with nothing upstairs has no stairs and exactly the room it
had before.

**The upper floor** is a second room of the same house from the same composer (`planRoom(place,
{ floor: 'up' })`): the `attic` plan (12 to 14 by 9 or 10 tiles), another seed, board walls under
rafters, a wooden floor, an heirloom as the focal point (an hourglass, a clock, a globe; a carved
stone in a cave), trunks, books and a chair as furniture, and nobody living there. The learning
wall becomes the advanced bench (a door labelled LAB II, only when some advanced station is not
behind a lock) and a bookshelf with the reading list (only with `further` links). The exit mat
becomes the stairwell down, so the walk-in contract (the entrance just above the exit) holds on
both floors.

**Signature objects** come from the kind (`kinds.js`: a lab gets a prism or an orrery, an archive
a clock, an hourglass or a globe, a cave a great crystal or a carved stone) or, in a home, from the
trade. A concept's known `emblem` is shown instead, big, on a pedestal, in a case or on a banner.

**Look at rooms:** `__hb.rooms()` in the browser console shows the course's rooms and a sample of
other kinds; `__hb.homes()` shows a home of every trade in the three themes.

## Experts' homes

A concept with `"expert": { "name", "trade", "line" }` in `course.json` lives in its expert's home
(kind `home`) instead of an institution; the expert is the host, dressed for the trade, and says
their line first. `world.json` may still give the concept another kind. Without experts nothing
changes, unless `world.json` asks for `"homes": "auto"`: then concepts of type `story`, `cases`
and `choice` become homes, with a trade that suits the type and a name chosen by the seed (a
story without a lab keeps its museum). The mapping is in one place: `kindOf` and `expertOf` in
`src/course/course.js`.

**Outside** (`home` in `src/gen/facade.js`): homes differ more than institutions do: a cottage
with a big roof, a town house with a balcony, a tall narrow house between two small gardens, a
house with a workshop on the ground floor, a boarded cabin on a deck (in a district by a river or
a shore). The trade says which shapes it likes. Every home keeps the name sign, the house number,
a brass name plate with the expert's name and, at the garden corner, a post with the trade's icon;
the roof, walls and windows follow the theme. Footprint 5 x 5, door in the middle. With
`"gen": { "facade": false }` a home is the hand-drawn cottage with its name.

**Inside:** a home, not an institution: wallpaper or panelling, wooden floors, and zones that say
who lives there (the cartographer's map table and plan chests, the dyer's vats under hanging cloth,
the cook's range and pantry, the musician's piano, the gardener's potting bench, the clockmaker's
bench, the doctor's examination corner and remedies, the painter's easel, the scholar's library,
the potter's kiln and wheel, the weaver's loom, the printer's type cases). The lab door is the same
door, glowing and labelled LAB.

**Trades** (`src/gen/interior/trades.js`): cartographer, dyer, cook, musician, gardener,
clockmaker, doctor, painter, scholar, potter, weaver, printer, and `home` for any other word. Each
gives its zones (most typical first), its signature object, its pictures, the host's look and its
exterior shapes and sign.

## How to add...

Every registry is plain data: adding one is adding one entry. Then run `npm test`, which composes
rooms with the new entry and checks every rule, and look at `__hb.rooms()` / `__hb.homes()`.

- **A plan:** a function in `PLANS` (`interior/plans.js`) returning `{ w, h, top, bot }` (per
  column: the row where the back wall starts, the row of the front wall) and any marks (`alcove`,
  `dais`, `pillars`).
- **A furniture piece:** footprint and height in `PIECES` (`interior/pieces.js`), a painter in
  `PAINT` (`interior/furniture.js`).
- **A zone:** an entry in `ZONES` (`interior/zones.js`) with a `back`, `side` or `island` layout,
  and its name in a kind (`interior/kinds.js`) or a trade.
- **A trade:** an entry in `TRADES` (`interior/trades.js`); a new signature object is a painter in
  `SIGNATURES` (`interior/furniture.js`), a new look an entry in `LOOKS` (`src/art/sprites.js`).
- **A wall decoration:** a painter in `DECOR` (`interior/paint.js`).
- **A home shape:** a painter in `HOME_PAINT` (`src/gen/facade.js`) and its name in `HOME_SHAPES`
  and in the trades that may use it.

## Generated dressing

Optional, on by default: `src/gen/dressing.js` fills the space the town leaves over with small
things, so that it looks cared for and differs from project to project. Same course, same town
(seeded `dressing:...`).

**What it adds:** a stone kerb where grass meets a plaza and a few pieces on the plaza's edge
(planters, benches, a stall, a well, a lantern...); things against the side walls of houses
(flower beds, woodpiles, barrels...); flower borders at the foot of house fronts; plots, that is
fenced allotments and flower gardens whose fences, walls or hedges join at the corners, with a
gate toward the nearest lane and stepping stones to it, and small unfenced orchards; things in
nooks of leftover grass (laundry lines, nets, firs, beehives...); on the water a jetty you can
walk onto, moored boats, reeds and lily pads. The beds inside a plot are laid out by a tiny Wave
Function Collapse (`src/gen/wfc.js`): crops run in rows, the next row differs.

**Themes and districts:** `THEMES.<name>.dressing` in `src/gen/core.js` says what appears and
its colours. `harbour`: rope fences and pickets, barrels, crates, nets, laundry, a jetty with a
lantern and two boats. `nordic`: picket and rail fences, woodpiles, sledges, firs, beehives,
lanterns on posts. `citadel`: clipped hedges and low stone walls, statues, wells, topiaries,
planters, no jetty. Each district is `floral` or `worked` (alternating, seeded), which picks the
fence and the lists; the square is `floral`.

**What stays fixed:** plazas, lanes (full width), river and ponds, bridges, houses and their
fronts, the tiles in front of doors, signs, landmarks and their surroundings, lamps, people,
the review meadow. Nothing solid goes near the water's edge or where a tree would hide it. Every
solid piece is accepted only if a breadth-first search from the start still reaches every tile it
reached before, and no lane, plaza, door step, landmark, sign or person got one step farther;
`npm run check` repeats that test (`dressing: ... no walk got longer`).

**Switch off:** `{ "gen": { "dressing": false } }` in `courses/<slug>/world.json`. The town is
then exactly as without the generator.

**Add a piece:** a painter in `STAND` (stands up, solid) or `FLAT` (on the ground) in
`src/gen/dressingArt.js`, its name in `TALL` in `dressing.js` if it stands up, and the name in a
theme's `plaza`, `side` or `corner` lists. Two tiles wide: add it to `WIDE`. **Add a theme
variant:** a `dressing` object on the theme with the same fields (`fence`, `plots`, `plaza`,
`side`, `corner`, `water`, `lantern`, `flowers`, `cloth`, `fruit`, `paint`). `__hb.gallery()`
shows every piece in the three themes on its last rows.

## Ambient life

On top of the generated town, an optional layer (`src/mechanics/`, see "Ambient life" in
`ENGINE.md`) adds thoughts, animals, secrets and obstacles. It changes the town in one way only:
obstacles (a boulder, a fallen trunk, a thicket, a locked garden gate with its small hedge, a
cellar hatch) are solid. They stand only at the mouth of optional side places, never on a door
approach or a tile the course needs, and every walking distance the course needs is the same with
them closed (`npm run check` and `npm run stress` prove it). `"life": false` in `world.json` leaves
the town exactly as the rest of this page describes; `"life": {"obstacles": false}` keeps the rest
of the layer without them.
