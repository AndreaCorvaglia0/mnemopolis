// Shared by the tests: a canvas that records nothing, so painters run in Node.
export function fakeCtx() {
  const ctx = { fillStyle: '', imageSmoothingEnabled: false, calls: 0 };
  for (const k of ['fillRect', 'clearRect', 'save', 'restore', 'translate', 'drawImage', 'scale', 'beginPath', 'fill', 'arc', 'moveTo', 'lineTo', 'stroke']) ctx[k] = () => { ctx.calls++; };
  return ctx;
}
export function installFakeDocument() {
  globalThis.document ??= { createElement: () => { const c = { width: 0, height: 0, style: {} }; const ctx = fakeCtx(); c.getContext = () => ctx; return c; } };
}
