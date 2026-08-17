// Tiny session-scoped clipboard for copied element styles (text FX + shape +
// hover rule templates). Shared so both the Text FX panel (copy/paste) and the
// Layers panel (paste-to-many) can read the same copied style.
let clip = null;
const subs = new Set();

export const getFxClip = () => clip;
export const setFxClip = (v) => { clip = v; subs.forEach((f) => { try { f(v); } catch { /* noop */ } }); };
export const subscribeFxClip = (fn) => { subs.add(fn); return () => subs.delete(fn); };
