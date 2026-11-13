# Step 4. Path: the order of the walk

The map says what is connected. The path says in which order one person meets it.

## A. Order

1. Start from the `requires` relations: a concept comes after everything it requires.
2. Among the orders that respect them, prefer:
   - **the simplest useful case first.** The first concept must be winnable with no prior
     knowledge of the subject, and must already show the big idea at work;
   - **concrete before abstract**, when the concept has a concrete instance;
   - **hubs early**: what many others depend on;
   - **a question before its answer**: put first the concept that raises the question the next
     one answers ("lights add" raises "then why does paint get darker?");
   - **use at the end**: a `cases` or `choice` concept that needs several earlier ones closes a
     theme or the course.
3. Optional material (`deep`) never blocks the path.

## B. Themes

Group the ordered concepts into **2 to 4 themes** of 1 to 4 concepts.

- A theme has its own one-sentence idea (18 words at most), a part or a consequence of the big
  idea. Read top-down, big idea, theme ideas and concept ideas must sound like an outline.
- Themes follow the order of the path: the learner finishes one before the next, though nothing
  forbids wandering.
- Give each theme a **cue** for memory: a landscape and a landmark, all different. Where an
  honest link with the content exists, use it and say it (a river for what flows, a hill for
  what gives an overview, a forest for origins). Do not force one: distinct is enough.

## C. Places

Every concept gets a **place name**: short, concrete, easy to picture, hinting at the content
("Three Lamps House", not "Module 1"), and a sign of 9 characters at most. The method of loci
needs places that are distinct and stable, in a fixed order. The name is part of the memory.

Optionally, a concept can have an `emblem`: a small icon that stands for it, shown on the house
and in its room as a memory cue. Choose it from the names in `engine/src/gen/emblems.js`.
Skip it at care light.

**An expert's home.** A concept may also live in a person's house instead of an institution:
`"expert": { "name": "Marta", "trade": "painter", "line": "one sentence in their voice" }`.
The house becomes their home, furnished for their trade, and they are the host who explains.
People remember a person and their house better than an office, so homes suit stories, cases,
crafts and judgement ("a dyer knows that colours change next to each other"). Keep institutions
(lab, archive, observatory...) for mechanisms and reference material, and mix the two: two or
three homes in a town are enough. Choose a trade from `engine/src/gen/interior/trades.js`
(cartographer, dyer, cook, musician, gardener, clockmaker, doctor, painter, scholar, potter,
weaver, printer); another word gives a generic home. Pick a trade with an honest link to the
concept, write the line so that it carries the concept's idea, and keep it true: the expert is a
character, not a source. The name fits a name plate (8 characters). Give the place a name that
says whose house it is ("Painter's House").

## D. Call-backs: repetition by design

Forgetting is fought by meeting an idea again, later, in a different setting. Plan it:

- For each concept from the second onward, name **one earlier concept it reuses**, and how the
  learner will notice ("as in Three Lamps House, lights add; here the cones do the adding").
  This goes in `callbacks`, and the sentence appears on the page or in a lab station.
- The cross-theme links found in step 3 are the best call-backs.
- Review questions (step 6) bring back the `remember` lines of earlier concepts while the
  learner is on the way to later ones. That is spacing; mixing them is interleaving.

## E. Size check

Estimate 5 to 8 minutes per lab station and 3 minutes per page. A standard course of 8 concepts
and 14 stations is about two hours of play, best taken in several sittings. If the estimate is
far above what the brief asked for, cut concepts, not stations. The main story should fit in
about an hour whatever the size: that is what the core is for (F).

## F. Core and extra

The game has a main story of about an hour: every **core** concept in path order (lab, then a
duel with its expert), then the final check. The other concepts are **extras**: `"core": false`.
Their houses stay in town, numbered in path order like the others, but nothing lists them: people
hint at them, and the map shows them as "?" until the learner has been inside. The final check
asks only about core concepts.

- Choose the core as the smallest set that still tells the whole story of the big idea: read the
  core ideas top-down and check that they make sense without the extras. Roughly 4 to 6 concepts,
  whatever the size of the course.
- The first concept is always core. A core concept never `requires` an extra one.
- Good extras: `deep` dives, the history of the idea (`story`), a second example of a mechanism
  already in the core, specialist cases.
- Time: the validator estimates the core path (6.5 minutes per station, 3 per concept, 1.5 per
  duel, about 20 seconds per final-check question) and warns above 60 minutes. Cut the core, not
  the stations: a concept moved out of the core keeps all its material.
- Write the choice and the reason in one or two lines of `brief.md` ("Core").

## G. Write it down

In `map.md`: the path as a numbered table (theme, number, concept, place, type, requires,
call-back), and one paragraph that says why this order and not another. Then run the
checkpoint with the user (see `SKILL.md`).

## Check before moving on

- [ ] No concept comes before something it requires.
- [ ] The first concept needs no prior knowledge and shows the big idea.
- [ ] Each theme idea follows from the big idea; each concept idea from its theme.
- [ ] Every concept after the first has a call-back.
- [ ] The core (4 to 6 concepts) tells the story alone and fits in about an hour; the brief says why.
- [ ] The user has seen the map, the path and the left-out list.
