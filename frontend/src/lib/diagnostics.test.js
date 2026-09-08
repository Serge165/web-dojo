import {
  initDiagnostics,
  instrumentFetch,
  sampleMemory,
  getBufferedEvents,
  clearDiagnosticsForTests,
} from "./diagnostics";

describe("client diagnostics", () => {
  beforeEach(() => {
    clearDiagnosticsForTests();
    jest.restoreAllMocks();
  });

  test("captures uncaught window errors", () => {
    initDiagnostics();
    window.dispatchEvent(Object.assign(new Event("error"), {
      message: "boom",
      filename: "app.js",
      lineno: 1,
      colno: 2,
      error: { stack: "Error: boom" },
    }));
    const events = getBufferedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe("error");
    expect(events[0].message).toBe("boom");
    expect(events[0].stack).toBe("Error: boom");
  });

  test("captures unhandled promise rejections", () => {
    initDiagnostics();
    window.dispatchEvent(Object.assign(new Event("unhandledrejection"), {
      reason: new Error("async blew up"),
    }));
    const events = getBufferedEvents();
    expect(events[0].kind).toBe("unhandled_rejection");
    expect(events[0].message).toBe("async blew up");
  });

  test("ring buffer stays bounded under a flood of events", () => {
    initDiagnostics();
    for (let i = 0; i < 500; i++) {
      window.dispatchEvent(Object.assign(new Event("unhandledrejection"), {
        reason: `fail-${i}`,
      }));
    }
    // MAX_EVENTS is 200 — the buffer must never exceed it in a long session.
    expect(getBufferedEvents().length).toBeLessThanOrEqual(200);
  });

  test("instrumentFetch records ok calls and passes the response through", async () => {
    const fakeRes = { ok: true, status: 200 };
    const spy = jest.spyOn(window, "fetch").mockResolvedValue(fakeRes);
    let mod;
    jest.isolateModules(() => { mod = require("./diagnostics"); });
    mod.instrumentFetch();
    await expect(window.fetch("/api/projects")).resolves.toBe(fakeRes);
    const events = mod.getBufferedEvents().filter((e) => e.kind === "api_ok");
    expect(events).toHaveLength(1);
    expect(events[0].url).toBe("/api/projects");
    expect(events[0].status).toBe(200);
    expect(typeof events[0].ms).toBe("number");
    spy.mockRestore();
  });

  test("instrumentFetch records network failures and rethrows", async () => {
    const spy = jest.spyOn(window, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    let mod;
    jest.isolateModules(() => { mod = require("./diagnostics"); });
    mod.instrumentFetch();
    await expect(window.fetch("/api/projects")).rejects.toThrow("Failed to fetch");
    const events = mod.getBufferedEvents().filter((e) => e.kind === "api_network_failure");
    expect(events).toHaveLength(1);
    expect(events[0].url).toBe("/api/projects");
    spy.mockRestore();
  });

  test("sampleMemory returns null where performance.memory is unsupported", () => {
    // jsdom has no performance.memory — must degrade to null, not throw.
    expect(sampleMemory()).toBeNull();
  });
});