import { buildMultiPageExport, buildStandaloneHtml } from "./exportHtml";

const page = (overrides) => ({
  id: "p1", name: "Home", slug: "index", elements: [], head_html: "", canvas_bg: "#ffffff",
  ...overrides,
});

test("buildStandaloneHtml defaults og:type to website and JSON-LD @type to WebSite", () => {
  const html = buildStandaloneHtml({ id: "p1", name: "Home", elements: [], seo: {} });
  expect(html).toContain('<meta property="og:type" content="website">');
  expect(html).toContain('"@type":"WebSite"');
});

test("buildStandaloneHtml honors seo.og_type and seo.schema_type when set (e.g. by a template)", () => {
  const html = buildStandaloneHtml({ id: "p1", name: "Home", elements: [], seo: { og_type: "product", schema_type: "Product", title: "Acme Widget" } });
  expect(html).toContain('<meta property="og:type" content="product">');
  expect(html).toContain('"@type":"Product"');
  expect(html).toContain('"name":"Acme Widget"');
});

test("buildMultiPageExport writes globals.css with clearly labeled sections in the right order", () => {
  const { files } = buildMultiPageExport({ id: "proj1", name: "Test Site", pages: [page({})] });
  const css = files["globals.css"];
  const order = ["Theme Variables", "Base", "Components", "Animations", "Media Queries"].map((label) =>
    css.indexOf(`/* ===== ${label} ===== */`)
  );
  expect(order.every((i) => i !== -1)).toBe(true);
  expect(order).toEqual([...order].sort((a, b) => a - b));
});

test("buildMultiPageExport extracts a data-forge-theme block into Theme Variables + Base, not left in the page's own head", () => {
  const headHtml = `<style data-forge-theme="dark">\n:root {\n  --fc-primary: #111;\n}\nbody { font-family: sans-serif; color: var(--fc-text); }\n</style>`;
  const { files } = buildMultiPageExport({ id: "proj1", name: "Test", pages: [page({ head_html: headHtml })] });
  const css = files["globals.css"];
  expect(css).toMatch(/Theme Variables[\s\S]*--fc-primary: #111;/);
  expect(css).toMatch(/Base[\s\S]*font-family: sans-serif/);
  expect(files["index.html"]).not.toContain("data-forge-theme");
});

test("buildMultiPageExport merges identical :root blocks cascaded across pages instead of repeating them", () => {
  const headHtml = `<style data-forge-theme="dark">\n:root {\n  --fc-primary: #111;\n}\n</style>`;
  const { files } = buildMultiPageExport({
    id: "proj1", name: "Test",
    pages: [page({ id: "p1", slug: "index", head_html: headHtml }), page({ id: "p2", slug: "about", head_html: headHtml })],
  });
  const css = files["globals.css"];
  expect(css.match(/--fc-primary: #111;/g)).toHaveLength(1);
});

test("buildMultiPageExport routes a data-forge-anim block into Animations, and data-forge-responsive-overrides into Media Queries", () => {
  const headHtml =
    `<style data-forge-anim="el1">\n@keyframes wd-fade-el1 { from { opacity: 0; } to { opacity: 1; } }\n</style>\n` +
    `<style data-forge-responsive-overrides>\n@media (max-width: 767px) {\n[data-forge-el-id="el1"]{display: none !important;}\n}\n</style>`;
  const { files } = buildMultiPageExport({ id: "proj1", name: "Test", pages: [page({ head_html: headHtml })] });
  const css = files["globals.css"];
  const animSection = css.split("/* ===== Animations ===== */")[1].split("/* ===== Media Queries ===== */")[0];
  expect(animSection).toContain("@keyframes wd-fade-el1");
  const mediaSection = css.split("/* ===== Media Queries ===== */")[1];
  expect(mediaSection).toContain('[data-forge-el-id="el1"]{display: none !important;}');
});

test("buildMultiPageExport folds RESPONSIVE_CSS's grid-collapse/flex-stack rule into Media Queries instead of a separate per-page <style> tag", () => {
  const { files } = buildMultiPageExport({ id: "proj1", name: "Test", pages: [page({})] });
  const css = files["globals.css"];
  expect(css).toContain('[style*="grid-template-columns"]');
  expect(css).toContain("[data-wd-stack]");
  expect(files["index.html"]).not.toMatch(/<style>@media[^<]*grid-template-columns/);
});

test("buildMultiPageExport keeps non-forge head_html content (e.g. a CDN embed) in the page's own head, not globals.css", () => {
  const headHtml = `<script src="https://example.com/widget.js"></script>`;
  const { files } = buildMultiPageExport({ id: "proj1", name: "Test", pages: [page({ head_html: headHtml })] });
  expect(files["index.html"]).toContain("https://example.com/widget.js");
  expect(files["globals.css"]).not.toContain("widget.js");
});

test("buildMultiPageExport extracts a data-forge-js script from element markup into js/<name>, replacing it with a src reference", () => {
  const html = `<div>${"<script data-forge-js=\"comments.js\">(function(){console.log('hi');})();</script>"}</div>`;
  const { files } = buildMultiPageExport({ id: "proj1", name: "Test", pages: [page({ elements: [{ id: "e1", html }] })] });
  expect(files["js/comments.js"]).toContain("console.log('hi')");
  expect(files["index.html"]).toContain('<script src="js/comments.js"></script>');
  expect(files["index.html"]).not.toContain("data-forge-js");
});

test("buildMultiPageExport writes one js file even when the same data-forge-js name appears on multiple pages/elements", () => {
  const html = `<div>${"<script data-forge-js=\"comments.js\">CODE_A</script>"}</div>`;
  const { files } = buildMultiPageExport({
    id: "proj1", name: "Test",
    pages: [
      page({ id: "p1", slug: "index", elements: [{ id: "e1", html }] }),
      page({ id: "p2", slug: "about", elements: [{ id: "e2", html }] }),
    ],
  });
  expect(Object.keys(files).filter((f) => f === "js/comments.js")).toHaveLength(1);
  expect(files["about.html"]).toContain('<script src="js/comments.js"></script>');
});

test("buildMultiPageExport extracts a data-forge-js script from head_html too", () => {
  const headHtml = `<script data-forge-js="tracker.js">window.track=1;</script>`;
  const { files } = buildMultiPageExport({ id: "proj1", name: "Test", pages: [page({ head_html: headHtml })] });
  expect(files["js/tracker.js"]).toContain("window.track=1");
  expect(files["index.html"]).toContain('<script src="js/tracker.js"></script>');
});

test("buildMultiPageExport routes an imported page's data-forge-imported-css into globals.css's Components section", () => {
  const headHtml = `<style data-forge-imported-css>\n.hero{color:red}\n</style>`;
  const { files } = buildMultiPageExport({ id: "proj1", name: "Test", pages: [page({ head_html: headHtml })] });
  const css = files["globals.css"];
  const componentsSection = css.split("/* ===== Components ===== */")[1].split("/* =====")[0];
  expect(componentsSection).toContain(".hero{color:red}");
  expect(files["index.html"]).not.toContain("data-forge-imported-css");
});
