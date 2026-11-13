// A small, safe expression language for the data of ready-made labs. No eval, no Function: a
// tokenizer and a recursive-descent parser build a tree of closures; nothing outside the listed
// functions and the variables the caller names can be reached.
//
//   const f = compile('2*sin(x) + a^2', ['x', 'a']);   // throws ExprError with a clear message
//   f({ x: 1, a: 3 })                                   // -> 10.68...
//   tryCompile(src, names) -> { fn } | { error }        // for validators
//   template('Period {1000/f:1} ms', names) -> fn(vars) // text with {expression[:decimals]}
//
// Grammar (lowest to highest precedence):
//   compare  : sum (( '<' | '<=' | '>' | '>=' | '==' | '!=' ) sum)?     -> 1 or 0
//   sum      : product (( '+' | '-' ) product)*
//   product  : unary (( '*' | '/' | '%' ) unary)*
//   unary    : ( '-' | '+' ) unary | power
//   power    : atom ( '^' unary )?                                      right-associative; -2^2 = -4
//   atom     : number | name | name '(' args ')' | '(' compare ')'
// Numbers: 12, 0.5, .5, 1e3. Names: letters, digits, _ (not first). Constants: pi, e.
export const FUNCS = {
  min: [1, 8, Math.min], max: [1, 8, Math.max], abs: [1, 1, Math.abs], sqrt: [1, 1, Math.sqrt],
  exp: [1, 1, Math.exp], log: [1, 1, Math.log], log10: [1, 1, Math.log10], sin: [1, 1, Math.sin],
  cos: [1, 1, Math.cos], tan: [1, 1, Math.tan], round: [1, 2, (x, d = 0) => { const k = 10 ** Math.round(d); return Math.round(x * k) / k; }],
  floor: [1, 1, Math.floor], ceil: [1, 1, Math.ceil], sign: [1, 1, Math.sign],
  clamp: [3, 3, (x, a, b) => Math.min(Math.max(x, a), b)],
  if: [3, 3, (c, a, b) => (c ? a : b)],
};
export const CONSTS = { pi: Math.PI, e: Math.E };
const MAX_LEN = 300, MAX_DEPTH = 40;

export class ExprError extends Error {}

function tokenize(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }
    const num = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
    if (num) { out.push({ t: 'num', v: parseFloat(num[0]), at: i }); i += num[0].length; continue; }
    const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
    if (name) { out.push({ t: 'name', v: name[0], at: i }); i += name[0].length; continue; }
    const two = src.slice(i, i + 2);
    if (['<=', '>=', '==', '!='].includes(two)) { out.push({ t: 'op', v: two, at: i }); i += 2; continue; }
    if ('+-*/%^(),<>'.includes(c)) { out.push({ t: 'op', v: c, at: i }); i++; continue; }
    throw new ExprError(`unexpected character "${c}" at position ${i + 1}. Allowed: numbers, names, + - * / % ^ ( ) , < > <= >= == !=`);
  }
  return out;
}

// compile(src, names): names are the variables the expression may use (an array or a Set)
export function compile(src, names = []) {
  if (typeof src === 'number') { if (!Number.isFinite(src)) throw new ExprError('a number must be finite'); return () => src; }
  if (typeof src !== 'string') throw new ExprError(`an expression must be a string or a number, not ${Array.isArray(src) ? 'a list' : typeof src}`);
  if (!src.trim()) throw new ExprError('the expression is empty');
  if (src.length > MAX_LEN) throw new ExprError(`the expression is longer than ${MAX_LEN} characters`);
  const known = new Set(names), toks = tokenize(src);
  let p = 0, depth = 0;
  const peek = () => toks[p], at = () => (toks[p] ? `at position ${toks[p].at + 1}` : 'at the end');
  const isOp = (v) => toks[p]?.t === 'op' && toks[p].v === v;
  const expect = (v) => { if (!isOp(v)) throw new ExprError(`expected "${v}" ${at()}`); p++; };
  const deeper = (f) => { if (++depth > MAX_DEPTH) throw new ExprError('the expression is nested too deeply'); const r = f(); depth--; return r; };

  const compare = () => deeper(() => {
    const a = sum();
    const t = peek();
    if (t?.t === 'op' && ['<', '<=', '>', '>=', '==', '!='].includes(t.v)) {
      p++; const b = sum();
      const f = { '<': (x, y) => x < y, '<=': (x, y) => x <= y, '>': (x, y) => x > y, '>=': (x, y) => x >= y, '==': (x, y) => Math.abs(x - y) < 1e-9, '!=': (x, y) => Math.abs(x - y) >= 1e-9 }[t.v];
      if (peek()?.t === 'op' && ['<', '<=', '>', '>=', '==', '!='].includes(peek().v)) throw new ExprError(`comparisons cannot be chained ${at()}: write min/max or two expressions`);
      return (v) => (f(a(v), b(v)) ? 1 : 0);
    }
    return a;
  });
  const sum = () => {
    let a = product();
    while (isOp('+') || isOp('-')) { const o = toks[p++].v, l = a, r = product(); a = o === '+' ? (v) => l(v) + r(v) : (v) => l(v) - r(v); }
    return a;
  };
  const product = () => {
    let a = unary();
    while (isOp('*') || isOp('/') || isOp('%')) { const o = toks[p++].v, l = a, r = unary(); a = o === '*' ? (v) => l(v) * r(v) : o === '/' ? (v) => l(v) / r(v) : (v) => l(v) % r(v); }
    return a;
  };
  const unary = () => deeper(() => {
    if (isOp('-')) { p++; const a = unary(); return (v) => -a(v); }
    if (isOp('+')) { p++; return unary(); }
    return power();
  });
  const power = () => {
    const a = atom();
    if (isOp('^')) { p++; const b = unary(); return (v) => a(v) ** b(v); }
    return a;
  };
  const atom = () => deeper(() => {
    const t = peek();
    if (!t) throw new ExprError('the expression ends too early');
    if (t.t === 'num') { p++; const n = t.v; return () => n; }
    if (t.t === 'op' && t.v === '(') { p++; const a = compare(); expect(')'); return a; }
    if (t.t === 'name') {
      p++;
      if (isOp('(')) {
        const f = FUNCS[t.v];
        if (!f) throw new ExprError(`unknown function "${t.v}". Functions: ${Object.keys(FUNCS).join(', ')}`);
        p++;
        const args = [];
        if (!isOp(')')) { args.push(compare()); while (isOp(',')) { p++; args.push(compare()); } }
        expect(')');
        if (args.length < f[0] || args.length > f[1]) throw new ExprError(`${t.v}() takes ${f[0] === f[1] ? f[0] : `${f[0]} to ${f[1]}`} argument${f[1] > 1 ? 's' : ''}, not ${args.length}`);
        const fn = f[2];
        return (v) => fn(...args.map((a) => a(v)));
      }
      if (Object.hasOwn(CONSTS, t.v) && !known.has(t.v)) { const n = CONSTS[t.v]; return () => n; }
      if (!known.has(t.v)) throw new ExprError(`unknown name "${t.v}"${known.size ? `. Names you can use here: ${[...known].join(', ')}` : ': no variables can be used here'}${FUNCS[t.v] ? ` (${t.v} is a function: write ${t.v}(...))` : ''}`);
      const k = t.v;
      return (v) => { const x = v[k]; return typeof x === 'number' ? x : NaN; };
    }
    throw new ExprError(`unexpected "${t.v}" ${at()}`);
  });

  const fn = compare();
  if (p < toks.length) throw new ExprError(`unexpected "${toks[p].v}" ${at()}${toks[p].t === 'num' || toks[p].t === 'name' ? ' (missing an operator such as * before it?)' : ''}`);
  return (vars = {}) => fn(vars);
}

export function tryCompile(src, names = []) {
  try { return { fn: compile(src, names) }; } catch (e) { if (e instanceof ExprError) return { error: e.message }; throw e; }
}

// Text with live values: "Wavelength {343/f:2} m". {expr} or {expr:d} with d decimals (0 to 6).
// Literal braces: {{ and }}.
export function template(text, names = []) {
  if (typeof text !== 'string') throw new ExprError('a label must be a string');
  const parts = [];
  let i = 0;
  while (i < text.length) {
    if (text.startsWith('{{', i)) { parts.push('{'); i += 2; continue; }
    if (text.startsWith('}}', i)) { parts.push('}'); i += 2; continue; }
    if (text[i] === '{') {
      const j = text.indexOf('}', i);
      if (j < 0) throw new ExprError(`"{" without "}" in "${text}"`);
      const inner = text.slice(i + 1, j), m = /^(.*?)(?::(\d))?$/.exec(inner);
      const f = compile(m[1], names), d = m[2] == null ? null : +m[2];
      parts.push((v) => fmt(f(v), d));
      i = j + 1; continue;
    }
    let j = i;
    while (j < text.length && text[j] !== '{' && !text.startsWith('}}', j)) j++;
    parts.push(text.slice(i, j)); i = j;
  }
  return (vars) => parts.map((x) => (typeof x === 'string' ? x : x(vars))).join('');
}

// numbers for people: d decimals, or a sensible number of them; thin minus sign
export function fmt(x, d = null) {
  if (!Number.isFinite(x)) return '–';
  if (d == null) { const a = Math.abs(x); d = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a === 0 ? 0 : 3; }
  let s = x.toFixed(d);
  if (/^-0(\.0*)?$/.test(s)) s = s.slice(1);
  return s.replace('-', '−');
}
