# Brief: Officina Prova (test fixture)

- **What this is:** a small Italian course used to test the engine in Italian (screenshots,
  play-through). It is not an example course: it lives in `engine/tests/fixtures/`, so the Pages
  workflow does not publish it and nothing counts it among the examples.
- **Subject:** simple machines: the lever, the inclined plane, the pulley (ideal machines, no friction).
- **Learner:** a curious adult without physics.
- **Size:** tiny (3 concepts, one station each). **Care:** light. **Level:** introductory.
- **Language:** Italian.
- **Covers on purpose:** a lab (Casa della Leva), a workshop (Bottega delle Rampe), an expert's home
  with a temper (Gino, theatrical) and a lock on the ground floor (a safe), six questions per concept.
- **Run it:** `COURSE=prova npm run build` in `engine/`, then `node scripts/itshots.mjs`.
