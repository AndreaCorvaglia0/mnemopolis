// Checks of locks (riddles), advanced stations and the progression of difficulty. Used by
// validate.mjs; pure (tests call it on edited courses). See ../references/7-progression.md.
//   checkProgression(course, { match, tools, care }) -> { errors: [], warns: [] }
// match: the engine's engine/src/mechanics/riddles/match.js when available (normalisation,
// "the clue contains the answer"); tools: the names of the obstacle tools; care: from the brief.

const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const sentences = (s) => String(s || '').split(/[.!?]+(?:\s|$)/).filter((x) => x.trim()).length;
const KINDS = ['safe', 'computer', 'door'];

export function checkProgression(c, { match = null, tools = null, care = null } = {}) {
  const errors = [], warns = [], err = (m) => errors.push(m), warn = (m) => warns.push(m);
  const concepts = c.concepts || [], byId = new Map(concepts.map((p) => [p.id, p])), seen = new Set();
  const norm = match?.normText || ((s) => String(s).toLowerCase().trim());
  let count = 0;
  for (const p of concepts) {
    const P = `concept "${p.id}"`, st = p.lab?.stations || [], adv = st.filter((s) => s.advanced), ground = st.filter((s) => !s.advanced);
    const noFloor = p.type === 'process' || (p.type === 'story' && !p.lab); // a workshop or a museum: no upper floor
    // advanced stations
    if (st.length && !ground.length) err(`${P}: every station is "advanced"; the ground-floor lab needs at least one`);
    if (adv.length > 2) err(`${P}: ${adv.length} advanced stations, keep 2 at most: the upper floor adds one step, not a second course`);
    if (adv.length && noFloor) warn(`${P}: a ${p.type === 'process' ? 'workshop' : 'museum'} has no upper floor, so its advanced stations cannot be reached`);
    if (concepts.indexOf(p) < Math.ceil(concepts.length / 2) && ground[0] && (ground[0].controls?.length || 0) > 1) warn(`${P} station "${ground[0].id}": the first station of an early house has ${ground[0].controls.length} controls. Start with one control and one surprise (references/7-progression.md)`);
    // riddles
    for (const [k, r] of (p.riddles || []).entries()) {
      count++;
      const R = `${P} riddle ${r.id ? `"${r.id}"` : k + 1}`;
      for (const f of ['id', 'kind', 'clue', 'answer', 'from', 'inside']) if (r[f] === undefined || r[f] === '' || r[f] === null) err(`${R}: "${f}" is missing`);
      if (r.id) { if (seen.has(r.id)) err(`${R}: id used twice in the course`); seen.add(r.id); if (!/^[a-z][a-z0-9-]*$/.test(r.id)) err(`${R}: id must be lowercase letters, digits and dashes`); }
      if (r.kind && !KINDS.includes(r.kind)) warn(`${R}: kind "${r.kind}" is not one of ${KINDS.join(', ')}; it will be a safe`);
      if (r.clue && words(r.clue) > 25) warn(`${R}: the clue has ${words(r.clue)} words. A sticky note holds a line or two`);
      const list = [].concat(r.answer ?? []).filter((a) => a !== '' && a != null);
      const type = r.type || (typeof list[0] === 'number' ? 'number' : 'text');
      if (!['text', 'number', 'code'].includes(type)) err(`${R}: type must be text, number or code`);
      if (!list.length) err(`${R}: no accepted answer`);
      for (const a of list) {
        if (type === 'text') {
          if (typeof a !== 'string') err(`${R}: the answer ${JSON.stringify(a)} is not text (set "type": "number")`);
          else { if (words(a) > 3) err(`${R}: the answer "${a}" has ${words(a)} words: three at most`); if (a.length > 24) warn(`${R}: the answer "${a}" is ${a.length} characters long: hard to type on a phone`); if (!norm(a)) err(`${R}: the answer "${a}" is empty once normalised`); }
        } else if (type === 'number') { if (!Number.isFinite(Number(a)) || (typeof a === 'string' && !/^-?\d+(\.\d+)?$/.test(a.trim()))) err(`${R}: the answer ${JSON.stringify(a)} is not one number`); }
        else if (!/^\d+$/.test(String(a).replace(/[\s-]/g, ''))) err(`${R}: the code ${JSON.stringify(a)} must be digits only`);
      }
      if (r.tolerance != null && type !== 'number') warn(`${R}: "tolerance" is only for numbers`);
      if (r.clue && match?.mentions && match.mentions(r.clue, { ...r, type })) warn(`${R}: the clue contains the answer`);
      // where the answer is taught
      const f = r.from || {}, src = f.concept ? byId.get(f.concept) : p;
      if (f.concept && !src) err(`${R}: from.concept "${f.concept}" is not a concept of the course`);
      else if (src) {
        if (f.station && !(src.lab?.stations || []).some((s) => s.id === f.station)) err(`${R}: from.station "${f.station}" is not a station of "${src.id}"`);
        if (f.page && !src.page?.length) err(`${R}: from.page, but "${src.id}" has no page`);
        if (!f.station && !f.page) warn(`${R}: "from" names neither a page nor a station; the hint will point at the reading wall`);
        if (f.station && (src.lab?.stations || []).find((s) => s.id === f.station)?.advanced) warn(`${R}: the answer is taught in an advanced station: a learner may not have seen it`);
        if (concepts.indexOf(src) > concepts.indexOf(p)) warn(`${R}: the answer is taught in "${src.id}", a later house`);
      }
      // what is inside
      const i = r.inside || {};
      if (typeof i !== 'object' || !Object.keys(i).length) err(`${R}: "inside" is empty. Make it worth the effort`);
      if (i.note && (sentences(i.note) < 1 || sentences(i.note) > 4)) warn(`${R}: the note has ${sentences(i.note)} sentences: 1 to 4`);
      for (const s of [].concat(i.station || [])) {
        const S = st.find((x) => x.id === s);
        if (!S) err(`${R}: inside.station "${s}" is not a station of "${p.id}"`);
        else if (!S.advanced) err(`${R}: inside.station "${s}" is a ground-floor station. Locks are never needed to finish: guard only "advanced" stations`);
      }
      for (const l of [].concat(i.link ?? [])) if (!(typeof l === 'number' ? p.further?.[l] : p.further?.some((x) => x.url === l))) err(`${R}: inside.link ${JSON.stringify(l)} is not one of the concept's "further" links`);
      if (i.coins != null && !(Number.isInteger(i.coins) && i.coins > 0)) err(`${R}: inside.coins must be a positive whole number`);
      if (i.tool && tools && !tools.includes(i.tool)) err(`${R}: inside.tool "${i.tool}" is not one of ${tools.join(', ')}`);
      if (i.key && !byId.has(i.key)) err(`${R}: inside.key "${i.key}" is not a concept`);
      if (i.note && !i.station && !i.link && !i.key && !i.tool && words(i.note) < 12) warn(`${R}: the note is very short. What is behind a lock should be an insight, not a trophy`);
      if ((r.where || 'upstairs') !== 'room' && noFloor) warn(`${R}: a ${p.type === 'process' ? 'workshop' : 'museum'} has no upper floor; use "where": "room"`);
      if (r.where === 'room' && noFloor) warn(`${R}: a workshop or a museum has no room for a lock yet; it will not be shown`);
    }
  }
  // how many locks, by care (references/7-progression.md)
  const n = concepts.length;
  if (care === 'light' && count) warn(`${count} riddles at care "light": the method suggests none`);
  if (care === 'standard' && count > Math.ceil(n / 2)) warn(`${count} riddles for ${n} houses at care "standard": about one per two houses`);
  if (count > n) warn(`${count} riddles for ${n} houses: one per house at most`);
  return { errors, warns };
}
