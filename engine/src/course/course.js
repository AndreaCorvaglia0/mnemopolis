// THE COURSE DATABASE. Everything the world shows comes from this file:
// the town is generated from `districts`, rooms from each place's `kind`, questions from `questions`.
// Replace the demo (Chroma Town, a mini course on colour) with your own course.
// Field-by-field reference: engine/docs/SCHEMA.md. Limits are enforced by `npm run check`.

export const COURSE = {
  id: 'chroma-demo', // save-game key: change it for every new course
  title: 'Chroma Town',
  subject: 'How colour works',
  // The one sentence the whole course hangs on. Shown on the title screen and at the top of the map.
  bigIdea: 'Colour is three numbers: three lights on a screen, three inks on paper, three signals in the eye.',

  hub: {
    name: 'Prism Square',
    monument: 'fountain', // fountain | obelisk | statue | arch | bell | stones
    guide: { name: 'Iris', look: 'mentor', hi: 'Welcome to Chroma Town. Every house has one idea about colour, and a lab to play with it.',
      options: [
        ['Where do I start?', 'Cross the bridge to the Lamp Quarter. Then the hill, then the old town. Tab shows the map.'],
        ['What is in a house?', 'A lab behind the glowing door, a reading wall, and someone who knows the place.'],
        ['What are the meadows for?', 'Tall grass hides quick questions about houses you have already visited. Say "not now" whenever you like.'],
      ] },
  },

  // 2 to 4 districts, in learning order. Each is one theme with its own landscape, so the place itself is a memory cue.
  districts: [
    {
      id: 'light', name: 'Lamp Quarter', nature: 'river', landmark: 'obelisk',
      idea: 'Light adds up. Ink takes away.',
      places: [
        {
          id: 'lamps', kind: 'lab', name: 'Three Lamps House', sign: 'LAMPS',
          concept: 'Additive mixing',
          objective: 'Predict the colour of any mix of red, green and blue light.',
          idea: 'A screen makes every colour by adding red, green and blue light. All three together make white.',
          anchor: { type: 'example', text: 'Three torches with coloured gels pointed at the same wall.' },
          host: { name: 'Lux', look: 'tech', hi: 'Three lamps, every colour. Try them in the lab.' },
          remember: ['Red + green light = yellow. All three lights = white.', 'A pixel is three numbers: red, green, blue, each from 0 to 255.', 'Equal numbers give a grey.'],
          explain: { q: 'Why does adding a second lamp never make the wall darker?', a: 'A lamp only adds light to what the wall already sends back. Nothing in the process removes light, so the sum can only grow.' },
          questions: [
            { level: 1, q: 'Red light plus green light gives...', options: ['Brown', 'Yellow', 'Purple', 'White'], answer: 1, why: 'Lights add. Red and green together stimulate the eye like yellow does.' },
            { level: 1, q: 'Red, green and blue light at full strength give...', options: ['Black', 'Grey', 'White', 'Brown'], answer: 2, why: 'Adding light always makes the result brighter. All three at full strength is white.' },
            { level: 2, q: 'A pixel is set to R 120, G 120, B 120. What do you see?', options: ['A dark red', 'A mid grey', 'White', 'Nothing'], answer: 1, why: 'Equal amounts of the three lights have no hue. The amount sets how light the grey is.' },
            { level: 3, q: 'A pixel shows yellow. Which sub-pixel is switched off?', options: ['Red', 'Green', 'Blue', 'None'], answer: 2, why: 'Yellow on a screen is red plus green. Blue stays dark.' },
          ],
        },
        {
          id: 'print', kind: 'workshop', name: 'Print Works', sign: 'PRINT',
          concept: 'Subtractive mixing',
          objective: 'Explain why printers use cyan, magenta and yellow, and why mixing inks gets darker.',
          idea: 'Ink works by removing light from white paper. Each ink removes one of the three lights.',
          anchor: { type: 'contrast', text: 'The same two colours mixed as lights and as inks, side by side.' },
          host: { name: 'Foreman Tinta', look: 'fisher', hi: 'White paper comes in, a picture goes out. Three machines.' },
          remember: ['Cyan absorbs red, magenta absorbs green, yellow absorbs blue.', 'More ink, less light: mixed inks get darker.', 'On paper, tone is the size of the dots.'],
          explain: { q: 'Why do printers use cyan, magenta and yellow, and not red, green and blue inks?', a: 'Cyan, magenta and yellow each remove one of the three lights, so they can be layered and still leave something. A red, green or blue ink removes two at once: any two of them on top of each other leave nothing.' },
          questions: [
            { level: 1, q: 'Cyan ink looks cyan because it absorbs...', options: ['Blue light', 'Green light', 'Red light', 'All light'], answer: 2, why: 'White minus red leaves green plus blue, which is cyan.' },
            { level: 1, q: 'Mixing more inks makes the result...', options: ['Lighter', 'Darker', 'More saturated', 'White'], answer: 1, why: 'Every ink removes some light. More inks, less light left.' },
            { level: 2, q: 'Yellow ink over magenta ink on white paper gives...', options: ['Green', 'Blue', 'Red', 'Black'], answer: 2, why: 'Yellow removes blue, magenta removes green. Only red is left.' },
            { level: 3, q: 'A printed photo has smooth greys. Up close you would see...', options: ['Grey ink', 'Black dots of different sizes', 'Three grey inks', 'Tiny lamps'], answer: 1, why: 'A printer puts ink or no ink. Tone comes from the size of the dots; the eye averages them.' },
          ],
        },
      ],
    },
    {
      id: 'eye', name: 'Sight Hill', nature: 'hill', landmark: 'statue',
      idea: 'Colour happens in the eye and the brain, not in the object.',
      places: [
        {
          id: 'wheel', kind: 'observatory', name: 'Hue Tower', sign: 'HUE',
          concept: 'Hue, saturation, lightness',
          objective: 'Describe any colour with three words (which colour, how vivid, how light) and link them to RGB.',
          idea: 'Hue, saturation and lightness are the same colours as RGB, described the way people talk.',
          anchor: { type: 'analogy', text: 'RGB is a street address; hue, saturation and lightness are directions given by a neighbour.' },
          host: { name: 'Keeper Tono', look: 'keeper', hi: 'Up here a colour has three dials. Turn them in the lab.' },
          remember: ['Hue = which colour (the angle on the wheel).', 'Saturation = how far from grey.', 'Lightness = how close to white or black.'],
          explain: { q: 'A designer says "same colour, just less loud". Which dial moves, and what happens to the three RGB numbers?', a: 'Saturation goes down. The three RGB numbers move toward each other; when they are equal the colour has become a grey.' },
          questions: [
            { level: 1, q: 'Which dial turns red into orange into yellow?', options: ['Hue', 'Saturation', 'Lightness', 'Contrast'], answer: 0, why: 'Hue is the position around the colour wheel.' },
            { level: 1, q: 'Saturation at zero gives...', options: ['Black', 'White', 'A grey', 'The pure colour'], answer: 2, why: 'With no saturation there is no hue left: only a grey whose lightness you chose.' },
            { level: 2, q: 'Pastel pink is a red with...', options: ['Low lightness', 'High lightness', 'A different hue', 'Zero saturation'], answer: 1, why: 'Same hue as red, pushed toward white.' },
          ],
        },
        {
          id: 'context', kind: 'studio', name: 'Illusion Studio', sign: 'ILLUSION',
          concept: 'Colour depends on context',
          objective: 'Show that the same patch looks different on different backgrounds, and say why that matters.',
          idea: 'The eye judges a colour against what surrounds it. The same numbers can look different.',
          anchor: { type: 'example', text: 'A grey card looks light in a dark room and dark on fresh snow.' },
          host: { name: 'Tess', look: 'tess', hi: 'Do not trust your eyes in here. Test them in the lab.' },
          remember: ['The same numbers can look different on different backgrounds.', 'A dark surround makes a patch look lighter; a coloured surround pushes it toward the opposite colour.'],
          explain: { q: 'Why is it a bad idea to compare two colour swatches that sit on different backgrounds?', a: 'The eye judges each swatch against its own surround, so the comparison measures the backgrounds as much as the swatches. Put both on the same neutral background.' },
          questions: [
            { level: 1, q: 'Two patches have identical RGB values. Can they look different?', options: ['No, never', 'Yes, if their surroundings differ', 'Only on old screens', 'Only in print'], answer: 1, why: 'Perceived colour depends on the surround. The numbers stay the same.' },
            { level: 2, q: 'A grey patch on a dark background looks...', options: ['Darker than it is', 'Lighter than it is', 'Unchanged', 'Bluish'], answer: 1, why: 'The eye exaggerates the difference from the surround: simultaneous contrast.' },
            { level: 3, q: 'You pick a text colour by eye on a dark mock-up. On a white page it looks wrong. Why?', options: ['The file changed', 'The surround changed', 'White pages are brighter', 'RGB is unreliable'], answer: 1, why: 'Judge a colour on the background it will actually be used on.' },
          ],
        },
      ],
    },
    {
      id: 'roots', name: 'Old Town', nature: 'forest', landmark: 'stones',
      idea: 'Three centuries to find out why three numbers are enough.',
      places: [
        {
          id: 'history', kind: 'museum', name: 'Colour Museum', sign: 'MUSEUM',
          concept: 'How we found out',
          objective: 'Place the key discoveries about colour in order and say what each one settled.',
          idea: 'From Newton’s prism to sRGB: each step turned colour from a mystery into numbers.',
          host: { name: 'Guide Orsola', look: 'archivist', hi: 'Walk east and you walk forward in time.' },
          kinds: { physics: ['Physics', '#4fd1c5'], eye: ['The eye', '#ffcf5a'], standard: ['Standards', '#ff7a6b'] },
          timeline: [
            { year: 1672, kind: 'physics', title: 'White light is a mixture', who: 'Isaac Newton', text: 'Newton passes sunlight through a prism and gets a band of colours; a second prism brings them back to white. Colour is not added by the glass: it is already in the light.', why: 'The start of everything in the Lamp Quarter: lights can be split and added.', src: 'Newton, letter to the Royal Society, 1672' },
            { year: 1802, kind: 'eye', title: 'Three kinds of receptor', who: 'Thomas Young', text: 'Young argues that the eye cannot hold a separate receptor for every colour. Three kinds, each answering to a broad range of light, would be enough.', why: 'The reason three lamps are enough.', src: 'Young, Bakerian Lecture, Philosophical Transactions, 1802' },
            { year: 1861, kind: 'physics', title: 'The first colour photograph', who: 'James Clerk Maxwell', text: 'Three black-and-white photographs of a tartan ribbon, taken through red, green and blue filters and projected through the same filters, combine into a colour image.', why: 'Young’s idea, working: three channels rebuild a coloured scene.', src: 'Maxwell, Royal Institution lecture, 1861' },
            { year: 1878, kind: 'eye', title: 'Opponent colours', who: 'Ewald Hering', text: 'Hering notes that nobody sees a reddish green or a yellowish blue. He proposes that vision works in opposing pairs: red against green, blue against yellow, light against dark.', why: 'Both views are right: three receptors first, opposing pairs after.', src: 'Hering, Zur Lehre vom Lichtsinne, 1878' },
            { year: 1905, kind: 'standard', title: 'Colour gets coordinates', who: 'Albert Munsell', text: 'A painter and teacher, Munsell orders colours by hue, value and chroma, with steps that look equal to the eye.', why: 'The ancestor of the three dials in the Hue Tower.', src: 'Munsell, A Color Notation, 1905' },
            { year: 1931, kind: 'standard', title: 'The standard observer', who: 'CIE', text: 'The International Commission on Illumination publishes colour-matching functions measured on human observers. Any light can now be written as three numbers that predict whether two lights will match.', why: 'Colour becomes measurable and comparable between laboratories.', src: 'CIE 1931 colour space' },
            { year: 1996, kind: 'standard', title: 'sRGB', who: 'HP and Microsoft', text: 'A shared default for what the three numbers of a pixel mean on an ordinary monitor. It becomes the standard colour space of the web.', why: 'Why the same file looks roughly the same on different screens.', src: 'Stokes et al., 1996; IEC 61966-2-1' },
          ],
          remember: ['1672, Newton: white light is a mixture.', '1802, Young: three kinds of receptor are enough.', '1931, CIE: colour as three measured numbers.'],
          questions: [
            { level: 1, q: 'Who showed that white light is a mixture of colours?', options: ['Young', 'Newton', 'Maxwell', 'Munsell'], answer: 1, why: 'Newton, with two prisms, in 1672.' },
            { level: 2, q: 'Maxwell’s 1861 photograph used...', options: ['One colour plate', 'Three filtered black-and-white photos', 'Hand colouring', 'A prism'], answer: 1, why: 'Red, green and blue filters: three channels, as a screen does today.' },
          ],
        },
        {
          id: 'cones', kind: 'cave', name: 'Cone Cave', sign: 'CONES',
          concept: 'Why three numbers are enough',
          objective: 'Explain how two physically different lights can look identical.',
          idea: 'The eye reduces any light to three signals. Lights that give the same three signals look the same.',
          anchor: { type: 'analogy', text: 'Three judges each give one score. Two very different performances can get the same three scores.' },
          host: { name: 'Old Marlo', look: 'surveyor', hi: 'Deep dive. One station, and it explains the whole town.' },
          remember: ['The eye keeps three signals for any light.', 'Different lights that give the same three signals look identical: metamers.'],
          explain: { q: 'A screen has no yellow lamp. Explain to a friend how it shows a lemon.', a: 'It lights the red and the green lamp together. That excites the long and medium cones in the same proportion as the yellow light of a lemon would, so the brain receives the same signals and sees the same colour.' },
          questions: [
            { level: 1, q: 'How many signals does the eye keep for any light?', options: ['One', 'Three', 'Seven', 'One per wavelength'], answer: 1, why: 'Three kinds of cone, three signals. Everything else about the light is lost.' },
            { level: 2, q: 'Why can a screen with three lamps show yellow without any yellow light?', options: ['It cannot', 'Red plus green gives the same cone signals as yellow light', 'The screen has a hidden yellow lamp', 'Yellow is not a real colour'], answer: 1, why: 'The eye only keeps three signals. Same signals, same colour, whatever the light was made of.' },
            { level: 3, q: 'Two lights with different spectra that look identical are called...', options: ['Complementary', 'Metamers', 'Primaries', 'Saturated'], answer: 1, why: 'Metamerism is what makes screens and printing possible.' },
          ],
        },
      ],
    },
  ],

  // The final check, in the hall on the square. Questions are drawn from levels 2 and 3 of every place.
  league: { name: 'Colour League', host: { name: 'Judge Ada', look: 'nurse' }, size: 8, pass: 0.7 },
};
