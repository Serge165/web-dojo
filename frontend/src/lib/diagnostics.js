// Lightweight client-side diagnostics for Web Dojo's builder (Task: "debugging
// suite"). Captures, in one place:
//   - uncaught errors & unhandled promise rejections (with stack + context)
//   - API request timings / failures via a fetch wrapper
//   - JS heap usage samples (where performance.memory exists — Chromium)
// Events land in an in-memory ring buffer (bounded — never grows unbounded in
// a long-running builder session) and are flushed in batches to
// POST /api/client-logs. Nothing here throws: diagnostics must be strictly
// fail-safe, an error inside the logger must never take the app down.
const MAX_EVENTS = 200;
const FLUSH_THRESHOLD = 20;
const FLUSH_INTERVAL_MS = 30000;
const SLOW_REQUEST_MS = 1500;

const state = {
  events: [],
  started: false,
  flushTimer: null,
  seq: 0,
};

const nowIso = () => new Date().toISOString();

const push = (kind, data) => {
  try {
    state.events.push({ kind, ts: nowIso(), seq: ++state.seq, ...data });
    if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
    if (state.events.length >= FLUSH_THRESHOLD) scheduleFlush(0);
  } catch { /* never throw from diagnostics */ }
};

export const getBufferedEvents = () => [...state.events];
export const clearDiagnosticsForTests = () => { state.events = []; };

// --- Flush ---------------------------------------------------------------
let flushing = false;
const flush = async () => {
  if (flushing || !state.events.length) return;
  const batch = state.events.splice(0, state.events.length);
  flushing = true;
  try {
    await fetch(`${process.env.REACT_APP_BACKEND_URL || ""}/api/client-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
  } catch {
    // Server unreachable — put the batch back (front), dropping overflow.
    state.events.unshift(...batch);
    if (state.events.length > MAX_EVENTS) state.events.splice(MAX_EVENTS);
  } finally {
    flushing = false;
  }
};

const scheduleFlush = (delay = FLUSH_INTERVAL_MS) => {
  if (state.flushTimer) return;
  state.flushTimer = setTimeout(() => {
    state.flushTimer = null;
    flush();
  }, delay);
};

// --- Instrumentation -----------------------------------------------------
export const initDiagnostics = () => {
  if (state.started || typeof window === "undefined") return;
  state.started = true;

  window.addEventListener("error", (e) => {
    // Resource-load errors (img/script) surface here with no error object —
    // record them as a distinct kind rather than a fake exception.
    if (!e.error && e.target && e.target !== window) {
      push("resource_error", { message: `failed to load ${(e.target.tagName || "").toLowerCase()}`, src: e.target.src || e.target.href || null });
      return;
    }
    push("error", { message: e.message || "unknown", stack: e.error?.stack?.slice(0, 4000) || null, source: `${e.filename}:${e.lineno}:${e.colno}` });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    push("unhandled_rejection", {
      message: String(r?.message || r || "unknown"),
      stack: r?.stack?.slice(0, 4000) || null,
    });
  });

  window.addEventListener("beforeunload", () => { flush(); });
};

// Wrap window.fetch to time every request and flag slow/failing calls.
// Returns the original fetch untouched when called twice (idempotent).
let instrumentedFetchStarted = false;
export const instrumentFetch = () => {
  if (instrumentedFetchStarted || typeof window === "undefined" || !window.fetch) return;
  const orig = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    const t0 = performance.now();
    try {
      const res = await orig(...args);
      const ms = Math.round(performance.now() - t0);
      push(res.ok ? "api_ok" : "api_error", { url, status: res.status, ms, slow: ms > SLOW_REQUEST_MS || undefined });
      return res;
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      push("api_network_failure", { url, ms, message: String(err?.message || err).slice(0, 500) });
      throw err;
    }
  };
  instrumentedFetchStarted = true;
};

// Sample JS heap size (Chromium-only; no-op elsewhere).
export const sampleMemory = () => {
  const m = performance.memory;
  if (!m) return null;
  const sample = {
    used_mb: Math.round(m.usedJSHeapSize / 1048576),
    total_mb: Math.round(m.totalJSHeapSize / 1048576),
    limit_mb: Math.round(m.jsHeapSizeLimit / 1048576),
  };
  push("memory_sample", sample);
  return sample;
};