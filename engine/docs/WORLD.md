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

`npm run shots` saves a picture of every kind of building and landmark (`shots/99-gallery.png`).

Every standard room is the same on purpose: the lab door glows on the left, the reading wall is
next to it, the host stands in the middle. Colour and floor change with the kind. The learner
learns the room once.

## Landscapes and landmarks

Landscapes (`nature`): `river` (the district lies across the river), `shore` (a pond with a sandy
edge beside it), `forest` (a grove around it), `meadow` (flower fields and stretches of fence),
`hill` (a rocky rise).

The town is compact on purpose. `npm run check` reports the walking distance from the square to
the farthest door and warns above 45 steps. Night is the default time of day (N changes it).

Landmarks (`landmark`, and `hub.monument`): `fountain`, `obelisk`, `statue`, `arch`, `bell`,
`stones`. Each can be used once.

Choose them for meaning where an honest link exists, otherwise simply for variety. Tell the
learner the link in the district's `idea` or in the guide's lines if there is one.

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
   `src/world/townMap.js`, a theme in `THEME` in `src/scenes/Interior.js`.
5. A new landscape: a rule in `generate()` in `src/world/townMap.js`, and possibly new
   ground painting in `src/art/ground.js`.
6. Music: tracks are chord lists in `src/systems/audio.js`.

Offer the custom look as a second step, after the course works. Pixel art drawn in code takes
several rounds of screenshots to get right.

## What not to change

- The limits (4 districts, 4 houses each). They are what keeps the town in one head.
- The sameness of rooms and of the lab frame.
- The rule that everything is generated from `course.js`. A hand-placed exception breaks the
  correspondence between town and map.
