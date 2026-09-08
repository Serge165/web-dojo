// Phase 9 "Educational branch" feature flags (from the DeepSeek build spec's
// educationalConfig: classrooms of up to 25 students, no billing).
//
// Flags are compile-time env vars (CRA REACT_APP_* convention) with a
// localStorage override so the classroom behaviour can be demoed without a
// rebuild. Backend counterpart: the EDUCATIONAL_MODE env var read in
// server.py — keep the two names in sync.

export const MAX_CLASSROOM_SEATS = 25;

const lsOverride = (key) => {
  try { return window.localStorage.getItem(key); } catch { return null; }
};

const envFlag = (v) => v === "1" || v === "true" || v === "yes";

// Educational mode: unlocks classroom features, disables monetization UI.
export const isEducational = () => {
  const override = lsOverride("wd_edu_mode");
  if (override !== null) return override === "1";
  return envFlag(process.env.REACT_APP_EDUCATIONAL_MODE);
};

// Billing is on unless we're in educational mode (spec: "no billing").
export const billingEnabled = () => !isEducational();

// Feature-flag gate for unreleased Phase 9 work — TODO.md §12.6 asks that
// "all major changes" be flaggable; new Phase 9 surfaces should hang off
// named flags here rather than shipping hard-on.
const FLAG_DEFAULTS = {
  collab: false,        // 9A real-time collaboration UI
  frameworkExports: true, // 9C Astro/Next/React exporters
  localFirst: true,     // 9E IndexedDB persistence + offline queue
};

export const featureEnabled = (flag) => {
  if (!(flag in FLAG_DEFAULTS)) return false;
  const override = lsOverride(`wd_flag_${flag}`);
  if (override !== null) return override === "1";
  if (typeof process !== "undefined" && process.env && process.env[`REACT_APP_FLAG_${flag.toUpperCase()}`] !== undefined) {
    return envFlag(process.env[`REACT_APP_FLAG_${flag.toUpperCase()}`]);
  }
  return FLAG_DEFAULTS[flag];
};
