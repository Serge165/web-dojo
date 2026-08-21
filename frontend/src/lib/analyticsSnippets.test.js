import { buildAnalyticsHead, upsertAnalyticsHead } from "./analyticsSnippets";

test("buildAnalyticsHead returns empty string when no provider is configured", () => {
  expect(buildAnalyticsHead({})).toBe("");
  expect(buildAnalyticsHead(undefined)).toBe("");
});

test("buildAnalyticsHead emits only the GA4 snippet when only ga4 is set", () => {
  const out = buildAnalyticsHead({ ga4: "G-ABC123" });
  expect(out).toContain("googletagmanager.com/gtag/js?id=G-ABC123");
  expect(out).toContain("gtag('config','G-ABC123')");
  expect(out).not.toContain("usefathom.com");
  expect(out).not.toContain("plausible.io");
});

test("buildAnalyticsHead emits multiple snippets when multiple providers are set", () => {
  const out = buildAnalyticsHead({ ga4: "G-ABC123", plausibleDomain: "example.com" });
  expect(out).toContain("googletagmanager.com");
  expect(out).toContain('data-domain="example.com"');
});

test("buildAnalyticsHead strips unsafe characters from IDs before splicing them in", () => {
  const out = buildAnalyticsHead({ ga4: '"><script>alert(1)</script>' });
  expect(out).not.toContain("<script>alert(1)</script>");
});

test("upsertAnalyticsHead replaces a prior block in place, no duplicate", () => {
  const first = upsertAnalyticsHead("<title>Hi</title>", { ga4: "G-ABC123" });
  const second = upsertAnalyticsHead(first, { ga4: "G-XYZ789" });
  expect(second.match(/forge-analytics:start/g)).toHaveLength(1);
  expect(second).toContain("G-XYZ789");
  expect(second).not.toContain("G-ABC123");
  expect(second).toContain("<title>Hi</title>");
});

test("upsertAnalyticsHead removes the block once no provider is configured", () => {
  const withSnippet = upsertAnalyticsHead("<title>Hi</title>", { ga4: "G-ABC123" });
  const cleared = upsertAnalyticsHead(withSnippet, {});
  expect(cleared).toBe("<title>Hi</title>");
});
