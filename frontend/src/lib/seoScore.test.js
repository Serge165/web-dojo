import { computeSeoChecks, scoreColor, collectExportSeoWarnings } from "./seoScore";

test("empty seo and no elements scores low with every field flagged", () => {
  const { checks, score } = computeSeoChecks({ seo: {}, elements: [] });
  expect(checks.find((c) => c.id === "title").status).toBe("fail");
  expect(checks.find((c) => c.id === "description").status).toBe("fail");
  expect(checks.find((c) => c.id === "content").status).toBe("fail");
  expect(score).toBeLessThan(30);
});

test("a fully-optimized page scores 100", () => {
  const seo = {
    title: "A".repeat(55),
    description: "B".repeat(155),
    keywords: "a, b, c, d",
    canonical: "https://example.com/",
    og_image: "https://example.com/og.png",
  };
  const words = Array.from({ length: 320 }, () => "word").join(" ");
  const elements = [{ html: `<p>${words}</p><img src="x.png" alt="a widget">` }];
  const { score, checks } = computeSeoChecks({ seo, elements });
  expect(score).toBe(100);
  expect(checks.every((c) => c.status === "pass")).toBe(true);
});

test("image without alt text fails the alt-text check", () => {
  const { checks } = computeSeoChecks({ seo: {}, elements: [{ html: '<img src="x.png">' }] });
  expect(checks.find((c) => c.id === "alt").status).toBe("fail");
});

test("a page with no images passes the alt-text check", () => {
  const { checks } = computeSeoChecks({ seo: {}, elements: [{ html: "<p>hello</p>" }] });
  expect(checks.find((c) => c.id === "alt").status).toBe("pass");
});

test("an unfilled [Bracket] placeholder fails the placeholders check without moving the score", () => {
  const optimizedSeo = {
    title: "A".repeat(55), description: "B".repeat(155), keywords: "a, b, c, d",
    canonical: "https://example.com/", og_image: "https://example.com/og.png",
  };
  const words = Array.from({ length: 320 }, () => "word").join(" ");
  const elements = [{ html: `<p>${words}</p><img src="x.png" alt="a widget">` }];
  const clean = computeSeoChecks({ seo: optimizedSeo, elements });
  const bracketedTitleSameLength = `[${"A".repeat(optimizedSeo.title.length - 2)}]`;
  const withPlaceholder = computeSeoChecks({ seo: { ...optimizedSeo, title: bracketedTitleSameLength }, elements });
  expect(clean.checks.find((c) => c.id === "placeholders").status).toBe("pass");
  expect(withPlaceholder.checks.find((c) => c.id === "placeholders").status).toBe("fail");
  expect(withPlaceholder.score).toBe(clean.score);
});

test("collectExportSeoWarnings flags only pages missing objectively-required fields", () => {
  const project = {
    pages: [
      { name: "Home", seo: { title: "A".repeat(55), description: "B".repeat(155), keywords: "a,b,c", canonical: "https://x.com/", og_image: "https://x.com/o.png" }, elements: [{ html: `<p>${Array.from({ length: 320 }, () => "word").join(" ")}</p>` }] },
      { name: "About", seo: {}, elements: [] },
    ],
  };
  const warnings = collectExportSeoWarnings(project);
  expect(warnings.length).toBe(1);
  expect(warnings[0]).toContain("About:");
  expect(warnings[0]).toContain("Title tag");
});

test("collectExportSeoWarnings falls back to top-level seo/elements for legacy single-page projects", () => {
  const project = { name: "Legacy", seo: {}, elements: [], pages: [] };
  const warnings = collectExportSeoWarnings(project);
  expect(warnings.length).toBe(1);
  expect(warnings[0]).toContain("Legacy:");
});

test("scoreColor buckets thresholds correctly", () => {
  expect(scoreColor(90)).toBe("text-emerald-500");
  expect(scoreColor(70)).toBe("text-lime-500");
  expect(scoreColor(40)).toBe("text-amber-500");
  expect(scoreColor(10)).toBe("text-red-500");
});
