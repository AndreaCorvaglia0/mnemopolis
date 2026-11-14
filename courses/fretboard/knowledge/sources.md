# Sources: Port Octave

Checked on 14 November 2026. The source ids are those of `course.json`. The syllabi read to choose
the content and its order are in `syllabi.md`; the sources below are the ones that facts rest on.

## Source log

| id | Source | Type and tier | Used for |
|---|---|---|---|
| S1 | J. Wolfe, UNSW Music Acoustics, *Strings, standing waves and harmonics* | university physics pages, A | f = v/2L, v = √(T/μ), harmonics nf₁, touching at 1/n, the 12th fret at the middle, tuning with harmonics and why it goes wrong |
| S2 | J. Wolfe, UNSW, *How does a guitar work?* | university pages, A | shorter string higher; A string 110 Hz; 440 Hz at fret 5 of the top string; lowest E about 83 Hz |
| S3 | OpenStax, *University Physics* vol. 1, 17.6 | open textbook, A | f_beat = \|f₂ − f₁\|; beats slow as frequencies approach; used by piano tuners |
| S4 | J. Wolfe, UNSW, *Music acoustics FAQ* (temperament) | university pages, A | 3:2 and 5:4 just; equal temperament by 2^(1/12); the equal-tempered third about 1.260 "not very close" to 5:4; near-coinciding harmonics beat slowly |
| S5 | J. Wolfe, UNSW, *Note names, MIDI numbers and frequencies* | university pages, A | A4 = 440 Hz by convention; f = 440 · 2^(n/12) |
| S6 | Wikipedia, *Guitar tunings* | reference, B | E2 A2 D3 G3 B3 E4 with frequencies; notated an octave higher than it sounds |
| S7 | R. M. Mottola, *Was the Rule of 18 Good Enough?* | luthier's article, B | frets by the twelfth root of two; 17.817; the old rule of 18 |
| S8 | Gotham et al., *Open Music Theory* 2e (major scales; triads) | open university textbook, A | W-W-H-W-W-W-H from any note; triads in thirds, major and minor qualities |
| S9 | Hutchinson, *Music Theory for the 21st-Century Classroom*, 5.2 | open textbook, A | half steps per interval (m3 3, M3 4, P4 5, P5 7, P8 12) |
| S10 | Wikipedia, *Circle of fifths* | reference, B | twelve fifths visit all notes and close in equal temperament; neighbours differ by one accidental; Pythagorean comma |
| S11 | Schmidt-Jones, *Understanding Basic Music Theory*, 6.7 | open textbook, A | clockwise adds a sharp, anticlockwise a flat |
| S12 | Applied Guitar Theory, *Major scale chords* | guitar teaching site, B | quality of the chords of a major key; G major's chords |
| S13 | Premier Guitar, *Cram Session: Pentatonic Power* | guitar magazine, B | 1–♭3–4–5–♭7; A minor pentatonic A C D E G; root-position box at fret 5; same notes as C major pentatonic |
| S14 | McDermott et al. 2016, *Nature* 535 | original paper (abstract read), A | Tsimane' rated consonant and dissonant chords equally pleasant; culture shapes the preference |
| S15 | Plomp and Levelt 1965, *JASA* 38 | original paper (abstract read), A | roughness from beating of close partials; simple ratios have fewer close partials |
| S16 | JustinGuitar PMT; Applied Guitar Theory, Foundational Theory | guitar courses, B | order of topics; open chords as starting material |
| S17 | Wikipedia, *Solmization* | reference, B | fixed-do names Do Re Mi Fa Sol La Si = C D E F G A B |

Computation: every frequency, ratio, fret position and beat rate in the course is computed from
f = 440 · 2^(n/12) (S5) or from the stated ratios, and was checked with a short script (results
quoted below). Arithmetic from a tier-A formula counts as one source; the second is the source
that states the same number.

## Claims table

| Claim (as the learner sees it) | Concept | Sources | Status |
|---|---|---|---|
| Frequency is vibrations per second, in hertz; higher frequency, higher note | string | S1, S3 | verified |
| A shorter, tighter or lighter string vibrates faster | string | S1 (v = √(T/μ), f = v/2L), S2 | verified |
| Half the length gives twice the frequency; the 12th fret sits in the middle of the string | string, twelve | S1, S7 (12th fret at half the scale length follows from 2^(−12/12) = 1/2) | verified |
| Frequency grows with the square root of the tension: four times the tension for twice the frequency | string (page) | S1 (v = √(T/μ)) | verified |
| The open A string is 110 Hz; the orchestral A is 440 Hz | string | S2, S5, S6 | verified |
| A4 = 440 Hz is a convention | twelve (source lines) | S5 ("by convention") | verified |
| Standard tuning E2 A2 D3 G3 B3 E4 = 82.41, 110, 146.83, 196, 246.94, 329.63 Hz | twelve (lock note) | S6; computed from S5 | verified |
| Guitar music is written an octave higher than it sounds | string (page) | S6; Wikipedia *Transposing instrument* (search result, not read in full) | verified (one source read) |
| A plucked string sounds harmonics at 2, 3, 4… times its frequency | beats, string | S1, S4 | verified |
| Touching at 1/2, 1/3, 1/4 isolates the 2nd, 3rd, 4th harmonic; above frets 12, 7, 5 | string (upstairs) | S1; fret 7 is at 0.3326 of the length and fret 5 at 0.2508 (computed), within 0.5 mm of 1/3 and 1/4 on a 650 mm string | verified, simplified (touch points drawn at the frets; declared in the source line) |
| Beats happen at the difference of the two frequencies; they slow as the notes approach; tuners use them | beats | S3, S4 | verified |
| At 2:1 and 3:2 some harmonics coincide and the beating stops; close harmonics beat (roughness) | beats | S4, S15 | verified |
| Consonance preference depends strongly on musical culture | beats (page, question) | S14 | verified; worded as "how much people like it is also learnt", not "consonance is cultural" |
| The pure fifth above 110 Hz is 165 Hz; the guitar's E3 is 164.81 Hz and beats about once in 2.7 s with it (3 × 110 − 2 × 164.81 = 0.37 Hz) | beats (lock) | S4, S5; computed | verified |
| Equal-tempered fifth 2^(7/12) ≈ 1.498; third 2^(4/12) ≈ 1.260 against 1.25 | beats (upstairs) | S4, S10 | verified |
| At A3 the guitar's C♯4 is 277.18 Hz against 275 Hz pure; 5 × 220 − 4 × 277.18 ≈ −8.7, "about nine beats a second" | beats (upstairs) | S5; computed | verified |
| Fret 5 of each string gives the next open string, fret 4 on the G string | beats, twelve (upstairs) | S6 (tuning E A D G B E); S9 (P4 = 5, M3 = 4 half steps); standard practice in S16 | verified |
| Twelve notes per octave; sharps and flats; no note between B–C and E–F | twelve | S8 (half and whole steps), S5 | verified |
| One fret is a half step; each fret multiplies the frequency by 2^(1/12) ≈ 1.0595; frets shrink by about 5.6 % of the remaining string | twelve | S5, S7; 1 − 2^(−1/12) = 0.0561 | verified |
| First fret of a 650 mm string 36.5 mm from the nut (650 / 17.817) | string (lock) | S7; computed | verified |
| Do Re Mi Fa Sol La Si are C D E F G A B | twelve (page) | S17; Wikibooks, *Music notation systems* (search result) | verified |
| The major scale is W W H W W W H from any note; from G it needs F♯; from D F♯ and C♯ | scale | S8; worked out with the pattern | verified |
| C major's notes from A give A minor, W H W W H W W (the relative minor) | scale (upstairs) | S8 (minor scales), T4 of the syllabi | verified |
| Minor pentatonic 1, ♭3, 4, 5, ♭7; A C D E G; box at fret 5 for A; same notes as C major pentatonic | pentatonic | S13, S16 | verified |
| G minor and B♭ major pentatonic share the same notes | pentatonic (lock) | same relation as S13 (minor = relative major pentatonic), worked out | verified |
| A fifth is seven half steps; twelve fifths visit all notes and come back; neighbouring keys differ by one sharp and share six notes | fifths | S9, S10, S11; shared notes counted | verified |
| C♯ major and F♯ major share only two notes with C major | fifths (traps) | counted from the scales | verified |
| A triad is root, third, fifth; major 4 + 3, minor 3 + 4 half steps; fifth 7 | triads | S8, S9 | verified |
| Open E major 022100 is E B E G♯ B E; lifting the G-string finger gives E minor | triads | S6 tuning, computed fret by fret | verified |
| Open shapes C x32010, A x02220, G 320003, E 022100, D xx0232 hold three names each; lowest string played is the root | triads (upstairs) | computed from S6; shapes as taught in S16 | verified |
| Chords of a major key: I IV V major, ii iii vi minor, vii diminished; G: G Am Bm C D Em F♯dim | keys | S12, S8 | verified |
| I–V–vi–IV is a common progression in popular songs | keys | S16 (JustinGuitar teaches "common progressions") | simplified: worded as "a common progression", no count claimed |

## Claims I was unsure of, and what I did

- "Frets 7 and 5 are at a third and a quarter of the string": not exactly (0.3326 and 0.2508). The
  game says the touch points are drawn at the frets and the source line says how far off they are.
- "Simple ratios sound pleasant": not claimed. The course says they **stop beating** (physics) and
  that **liking** that is partly learnt (S14).
- "Guitar sounds an octave lower than written": read in one source (S6), consistent with S2 and S5
  (the open A string is A2, 110 Hz, and is written as A3); kept as one sentence on a page, without
  any staff position.
- "Wah-wah" beats when tuning fret 5 against an open string: physics says it (S3), guitar teaching
  practice too; the station "Tune by ear" computes the rate rather than claiming any number.
