import { scanHtml, inlineLocalStylesheets } from "./importHtml";
import { buildMultiPageExport } from "./exportHtml";

test("consolidates <style> tags from head and body into one data-forge-imported-css block", () => {
  const raw = `<html><head><style>.hero{color:red}</style></head><body><section><style>.btn{color:blue}</style><h1>Hi</h1></section></body></html>`;
  const { headHtml, sections } = scanHtml(raw);
  expect(headHtml).toContain('<style data-forge-imported-css>');
  expect(headHtml).toContain(".hero{color:red}");
  expect(headHtml).toContain(".btn{color:blue}");
  // the original body <style> tag was removed, not left duplicated inline
  expect(sections[0].html).not.toContain("<style>");
});

test("dedupes identical style text found in multiple tags", () => {
  const raw = `<html><head><style>.a{color:red}</style><style>.a{color:red}</style></head><body><p>hi</p></body></html>`;
  const { headHtml } = scanHtml(raw);
  expect(headHtml.match(/\.a\{color:red\}/g)).toHaveLength(1);
});

test("captures semantic top-level sections as before when present", () => {
  const raw = `<html><body><header>H</header><section>S1</section><footer>F</footer></body></html>`;
  const { sections } = scanHtml(raw);
  expect(sections.map((s) => s.label)).toEqual(["header", "section", "footer"]);
});

test("falls back to div-soup capture when no semantic tags are present", () => {
  const raw = `<html><body><div class="hero">Hero</div><div class="features">Features</div></body></html>`;
  const { sections } = scanHtml(raw);
  expect(sections).toHaveLength(2);
  expect(sections[0].label).toBe("div.hero");
  expect(sections[1].label).toBe("div.features");
});

test("div-soup fallback never runs when semantic capture already found sections", () => {
  const raw = `<html><body><section>S1</section><div class="extra">Extra</div></body></html>`;
  const { sections } = scanHtml(raw);
  // only the semantic <section> is captured; the sibling <div> is left alone,
  // matching the pre-existing (nested-capture-only) semantic behavior
  expect(sections).toHaveLength(1);
  expect(sections[0].label).toBe("section");
});

test("whole-body fallback still applies when nothing else matches", () => {
  const raw = `<html><body>just some text, no wrapping elements</body></html>`;
  const { sections } = scanHtml(raw);
  expect(sections).toHaveLength(1);
  expect(sections[0].id).toBe("imported-body");
});

test("inlineLocalStylesheets swaps a local <link rel=stylesheet> for the matching sibling file's CSS", () => {
  const raw = `<link rel="stylesheet" href="styles.css">`;
  const out = inlineLocalStylesheets(raw, { "styles.css": ".btn{color:blue}" });
  expect(out).toBe("<style>.btn{color:blue}</style>");
});

test("inlineLocalStylesheets leaves remote/CDN stylesheet links untouched", () => {
  const raw = `<link rel="stylesheet" href="https://cdn.example.com/a.css">`;
  const out = inlineLocalStylesheets(raw, { "a.css": ".x{color:red}" });
  expect(out).toBe(raw);
});

test("folder import: a page + sibling CSS file ends up consolidated into scanHtml's headHtml", () => {
  const raw = `<html><head><link rel="stylesheet" href="styles.css"></head><body><section>S</section></body></html>`;
  const withCss = inlineLocalStylesheets(raw, { "styles.css": ".hero{color:red}" });
  const { headHtml } = scanHtml(withCss);
  expect(headHtml).toContain('<style data-forge-imported-css>');
  expect(headHtml).toContain(".hero{color:red}");
});

// ===== Phase 6 Task 5: Oxygen-style template validation =====
// Oxygen (WordPress builder) exports are div-structured ("div soup") with
// one global <style> carrying every section's rules (media queries
// included), a Google Fonts <link> + framework CSS in the head, and
// CDN-hosted images.

test("scanHtml parses an Oxygen-style template: div-soup sections, consolidated CSS with media queries, head links preserved", () => {
  const oxygen = `<!doctype html><html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://example-cdn.com/oxygen/framework.css">
<style>
.oxy-section { padding: 80px 24px; }
.oxy-headline { font-family: 'Inter', sans-serif; font-size: 48px; }
@media (max-width: 767px) { .oxy-headline { font-size: 28px; } }
</style>
</head><body>
<div class="oxy-section oxy-hero"><div class="oxy-inner"><h1 class="oxy-headline">Build faster</h1><p class="oxy-text">Ship your site in hours.</p></div></div>
<div class="oxy-section oxy-gallery"><img src="https://example-cdn.com/imgs/shot-1.jpg" alt="Work"><img src="https://example-cdn.com/imgs/shot-2.jpg" alt="Work 2"></div>
</body></html>`;
  const { headHtml, sections } = scanHtml(oxygen);
  // div soup → both top-level sections captured, images kept as-is
  expect(sections).toHaveLength(2);
  expect(sections[0].html).toContain("oxy-headline");
  expect(sections[1].html).toContain("https://example-cdn.com/imgs/shot-1.jpg");
  // every CSS rule — the media query included — is consolidated, not stranded
  expect(headHtml).toContain('<style data-forge-imported-css>');
  expect(headHtml).toContain(".oxy-headline { font-family: 'Inter', sans-serif; font-size: 48px; }");
  expect(headHtml).toContain("@media (max-width: 767px)");
  // head leftovers (fonts preconnect/stylesheet + CDN framework) survive
  expect(headHtml).toContain("https://fonts.googleapis.com/css2?family=Inter");
  expect(headHtml).toContain("https://example-cdn.com/oxygen/framework.css");
});

test("an Oxygen import end-to-end: consolidated CSS lands in globals.css, never the exported page head", () => {
  const { headHtml, sections } = scanHtml(
    `<!doctype html><html><head><style>@media (max-width: 767px){.oxy-hero{padding:24px 8px;}}</style></head><body><div class="oxy-hero"><h1>Hi</h1></div></body></html>`
  );
  const { files } = buildMultiPageExport({
    id: "proj1", name: "Imported",
    pages: [{ id: "p1", name: "Home", slug: "index", elements: sections, head_html: headHtml, canvas_bg: "#ffffff" }],
  });
  expect(files["globals.css"]).toContain(".oxy-hero{padding:24px 8px;}");
  expect(files["globals.css"]).toContain("@media (max-width: 767px)");
  expect(files["index.html"]).not.toContain("data-forge-imported-css");
  expect(files["index.html"]).not.toContain("<style");
});
