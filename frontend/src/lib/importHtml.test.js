import { scanHtml, inlineLocalStylesheets } from "./importHtml";

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
