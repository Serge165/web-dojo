// Tiny session-scoped clipboard for the currently-configured (but not yet
// applied) animation, so the Motion panel and the Layers panel's
// multi-select batch bar can share it without lifting state into
// Builder.jsx. Mirrors lib/fxClipboard.js's identical pattern for copied
// text-fx styles.
let clip = null;
const subs = new Set();

export const getAnimClip = () => clip;
export const setAnimClip = (v) => { clip = v; subs.forEach((f) => { try { f(v); } catch { /* noop */ } }); };
export const subscribeAnimClip = (fn) => { subs.add(fn); return () => subs.delete(fn); };
