# Step 2. Gather: material, web, user

The aim is a body of material you can trust, and a record of where every claim comes from.

## Scout before you choose

Before deciding what the course contains, spend a few searches on how the subject is taught by
people who teach it well. This matters most when the user gave a subject and no material.

- Find **two or three reference outlines**: a university syllabus, the contents of a standard
  textbook, an established open course. What they all include is the core. What only one
  includes is optional.
- Note their **order**: it usually encodes the prerequisites.
- Keep the two or three best resources you meet for each theme. They become the learner's
  "go further" links (`further` on a concept: three at most, each with one line on why).

How much to scout depends on the care in the brief. Light: one or two reference outlines, the
basic concepts only, no search for extra examples or real material; every fact still verified.
Standard: as described here. Curated: more outlines and sources, cross-checks of numbers and
definitions, and a search for real open material for the labs.

## Order of work

1. **Read all the user's material first**, completely. It defines the scope, the vocabulary and
   the level. Note what it covers, what it assumes, and where it is thin.
2. **List the gaps.** Compare the material with the goals in the brief. Typical gaps:
   - a goal the material does not cover;
   - a term used but never defined;
   - a claim with no reason given;
   - no examples, or no real-world use;
   - nothing about what people get wrong.
3. **Search the web to fill and to check.** For each concept that will probably be kept, look for:
   - a **definition** from a primary or reference source, to check the user's material against;
   - the **typical misconception** ("common misconceptions about X", "students often think");
   - a **canonical example** and a **real application** (where is this actually used?);
   - **numbers, dates and names** that will appear in the course, each checked once;
   - an **existing interactive explanation** of the concept, to learn from (not to copy).
4. **Ask the user** only what neither the material nor the web can settle: their goals and
   level, a choice of scope, their own examples and data, the mistakes they make, and which
   source to follow when two disagree. One batch of questions, not a trickle.

Without web access, say so, work from the user's material, and mark as `unverified` every claim
you could not check.

## How far to trust a source

| Tier | Examples | Use |
|---|---|---|
| A | The user's own material; standards; original papers; official documentation; textbooks; university course pages | Facts can rest on these |
| B | Reference works; review articles; established educational sites; reputable science journalism | Good for explanations and examples; check key facts against tier A |
| C | Blogs, forums, answers sites, marketing pages, content with no author | Leads only. Never the sole source of a fact |

When the user's material and a tier A source disagree, do not choose silently: put it in the
questions to the user. The user's material is often right for their context (a course, a
company, a country).

## The source log (`knowledge/sources.md`)

One row per source:

| id | Source | Type and tier | What it is used for | Checked on |
|---|---|---|---|---|
| S1 | title, author, link or file name | user notes, A | scope, definitions of ... | date |

And a **claims table** for everything factual that the learner will read:

| Claim (as the learner will see it) | Concept | Source ids | Status |
|---|---|---|---|
| ... | ... | S1, S4 | verified / simplified / unverified |

- **verified**: stated by a tier A or B source you read. Numbers, dates, names and anything
  surprising need **two independent sources** that agree.
- **simplified**: true enough for this learner, with the simplification named. It must also be
  declared in the course (the `source` line of a lab station, or a sentence on the page).
- **unverified**: remove it, or ask the user. An unverified claim does not go into `course.json`.

Record the source ids on each concept (`sources`), so that a reviewer can trace any sentence.

## Rights

- Write every text in your own words. Short quotations only, with the source.
- For labs, look for **real open material** before settling for a simulation: public datasets,
  openly licensed images, recordings, sample files. A lab on the real thing beats a drawing of it.
- Images, data and sounds: use the user's own, or material with a licence that allows reuse.
  Record the licence in the source log. If in doubt, leave it out or draw it.
- Never present invented numbers as data.
