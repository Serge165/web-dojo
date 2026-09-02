import { buildMultiPageExport, buildCleanExport, buildStandaloneHtml, deduplicateHeadTags, sanitizeHeadVars } from "./exportHtml";
import { gemThemeHeadHtml } from "./themeCompiler";

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

// Phase 4b Task 2: deduplicate repeated <link>/<meta> tags in the head.
test("deduplicateHeadTags removes duplicate <link> and <meta> tags, keeping first occurrence", () => {
  const headHtml = [
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">',
    '<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">',
    '<meta name="description" content="test">',
    '<meta name="description" content="test">',
  ].join("\n");

  const result = deduplicateHeadTags(headHtml);
  expect((result.match(/<link /g) || []).length).toBe(3);
  expect((result.match(/<meta name="description"/g) || []).length).toBe(1);
});

test("deduplicateHeadTags leaves non-link/meta content untouched", () => {
  const headHtml = '<script>console.log("keep me")</script>\n<link rel="stylesheet" href="globals.css">';
  const result = deduplicateHeadTags(headHtml);
  expect(result).toContain('<script>console.log("keep me")</script>');
  expect(result).toContain('href="globals.css"');
});

// Phase 4b Task 3: strip leftover template placeholders and undefined/null tokens from head.
test("sanitizeHeadVars removes unresolved placeholders ${{...}} and ${...}", () => {
  const headHtml = '<title>${{projectName}}</title>\n<meta name="description" content="${projectDescription}">';
  const result = sanitizeHeadVars(headHtml);
  expect(result).not.toContain("${{projectName}}");
  expect(result).not.toContain("${projectDescription}");
});

test("sanitizeHeadVars strips literal undefined/null tokens from attribute values", () => {
  const headHtml = '<meta name="undefined" content="test">\n<link rel="stylesheet" href="undefined">\n<title>undefined</title>';
  const result = sanitizeHeadVars(headHtml);
  expect(result).not.toMatch(/\bundefined\b/);
  expect(result).not.toMatch(/\bnull\b/);
});

test("buildStandaloneHtml export head has no duplicate links or undefined variables", () => {
  const html = buildStandaloneHtml({
    id: "proj1",
    name: "Test",
    elements: [],
    seo: {},
    head_html: '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<meta name="undefined">',
    fonts: ["Inter", "400"],
  });
  // Only one preconnect link for fonts.gstatic.com.
  expect((html.match(/fonts\.gstatic\.com/g) || []).length).toBe(1);
  // No raw `undefined` left in the head.
  expect(html).not.toMatch(/\bundefined\b/);
});
// ===== Phase 5 smoke-test remediation (Issues #2, #3, #7) =====

test("buildStandaloneHtml strips inline style attributes from block markup into class rules (Issue #2)", () => {
  const html = '<nav data-wd-cat="navbars" data-wd-block="nav-mega" style="font-family:Manrope,system-ui,sans-serif;background:var(--fc-bg, #fff1f1);border-bottom:1px solid var(--fc-border, #e2e8e0);">content</nav>';
  const out = buildStandaloneHtml({ id: "p1", name: "T", elements: [{ id: "e1", html }] });
  expect(out).not.toContain('style="font-family:Manrope');
  expect(out).toContain('class="block block-navbars-mega-1');
  // The lifted declarations land in the consolidated <style> block.
  expect(out).toContain(".block-navbars-mega-1 { font-family:Manrope");
});

test("buildStandaloneHtml routes <style data-forge-vars> out of the head into the consolidated style block (Issue #7)", () => {
  const headHtml = '<style data-forge-vars>\n:root {\n  --fc-el_mx3owqxt-bg: url("data:image/svg+xml,...") bottom / 100% 120px no-repeat;\n}\n</style>';
  const out = buildStandaloneHtml({ id: "p1", name: "T", elements: [], head_html: headHtml });
  // The forge-vars tag itself is gone from the head...
  expect(out).not.toContain("data-forge-vars");
  // ...and the variables live on inside the single consolidated style block
  // (the single-file equivalent of the site export's globals.css sections),
  // alongside the responsive baseline — not as a duplicated second <style>.
  expect(out).toContain("--fc-el_mx3owqxt-bg");
  expect((out.match(/<style>/g) || []).length).toBe(1);
  expect(out).toContain("@media (max-width: 1024px)");
});

test("buildStandaloneHtml keeps the head free of the project-id bootstrap (rides on <body data-wd-project>)", () => {
  const out = buildStandaloneHtml({ id: "p1", name: "T", elements: [] });
  const head = out.split("</head>")[0];
  expect(head).not.toContain("__WD_PROJECT_ID");
  expect(out).toContain('<body data-wd-project="p1">');
  expect(out.indexOf("window.__WD_PROJECT_ID")).toBeGreaterThan(out.indexOf("</head>"));
});

test("buildCleanExport keeps the head boilerplate-only (Issues #2/#7)", () => {
  const { html, css } = buildCleanExport({
    id: "proj1",
    name: "T",
    elements: [{ id: "e1", html: '<section data-wd-cat="heroes" data-wd-block="hero-centered" style="padding:64px;">H</section>' }],
    head_html: '<style data-forge-vars>\n:root { --fc-primary: #111; }\n</style>',
  });
  const head = html.split("</head>")[0];
  expect(head).not.toContain("__WD_PROJECT_ID");
  expect(head).not.toContain("data-forge-vars");
  expect(head).toContain('<link rel="stylesheet" href="globals.css"');
  expect(html).not.toContain('style="padding:64px');
  expect(html).toContain('<body data-wd-project="proj1">');
  expect(html.indexOf("window.__WD_PROJECT_ID")).toBeGreaterThan(html.indexOf("</head>"));
  expect(css).toContain(".block-heroes-centered-1 { padding:64px; }");
  expect(css).toContain("--fc-primary: #111");
  expect(css).toContain("@media (max-width: 1024px)");
});

test("buildStandaloneHtml applies an Avalon GEMS theme (data-forge-theme block from gemThemeHeadHtml)", () => {
  const out = buildStandaloneHtml({ id: "p1", name: "T", elements: [], head_html: gemThemeHeadHtml("sapphire") });
  const head = out.split("</head>")[0];
  expect(head).not.toContain("data-forge-theme");
  expect(out).toContain("body {");
  expect(out).toContain("background: linear-gradient(135deg, #191970");
  expect(out).toContain("@keyframes gem-pulse");
});

test("buildMultiPageExport applies an Avalon GEMS theme identically across every page's shared globals.css", () => {
  const project = {
    id: "proj1", name: "T",
    pages: [
      page({ id: "p1", slug: "index", head_html: gemThemeHeadHtml("topaz") }),
      page({ id: "p2", slug: "about", head_html: gemThemeHeadHtml("topaz") }),
    ],
  };
  const { files } = buildMultiPageExport(project);
  expect(files["index.html"]).not.toContain("data-forge-theme");
  expect(files["about.html"]).not.toContain("data-forge-theme");
  expect(files["globals.css"]).toContain("background: linear-gradient(135deg, #b8860b");
  expect(files["globals.css"]).toContain("@keyframes gem-pulse");
});

test("buildMultiPageExport emits typed <body> tags and per-page canvas vars instead of <style> tags (Issues #3/#7)", () => {
  const { files } = buildMultiPageExport({
    id: "proj1",
    name: "T",
    pages: [
      page({ id: "p1", slug: "index", canvas_bg: "#101418" }),
      page({ id: "p2", slug: "about", type: "layout", canvas_bg: "#ffffff" }),
    ],
  });
  expect(files["index.html"]).toContain('data-wd-page="index" data-wd-page-type="page"');
  expect(files["about.html"]).toContain('data-wd-page="about" data-wd-page-type="layout"');
  for (const f of ["index.html", "about.html"]) {
    const head = files[f].split("</head>")[0];
    expect(head).not.toContain("body{margin:0;background:");
    expect(head).not.toContain("__WD_PROJECT_ID");
    expect(files[f].indexOf("window.__WD_PROJECT_ID")).toBeGreaterThan(files[f].indexOf("</head>"));
  }
  const css = files["globals.css"];
  expect(css).toContain('[data-wd-page="index"] { --wd-canvas-bg: #101418; }');
  expect(css).toContain("body { margin: 0; background: var(--wd-canvas-bg, #ffffff); }");
});

test("buildMultiPageExport strips inline styles from body markup across pages (Issue #2)", () => {
  const html = '<nav data-wd-cat="navbars" data-wd-block="nav-mega" style="font-family:Manrope;background:var(--fc-bg, #fff);">N</nav>';
  const { files } = buildMultiPageExport({
    id: "proj1",
    name: "T",
    pages: [page({ id: "p1", slug: "index", elements: [{ id: "e1", html }] })],
  });
  expect(files["index.html"]).not.toContain('style="font-family:Manrope');
  // The multi-page bundle prefixes per-page class rules with the page name.
  expect(files["globals.css"]).toContain(".index-block-navbars-mega-1");
  expect(files["globals.css"]).toContain("Blocks: Navbars");
});

test("sanitizeHeadVars drops style tags emptied by the cleanup (no dead <style> shells)", () => {
  const result = sanitizeHeadVars('<style data-forge-vars>\n${{projectVars}}\n</style>\n<link rel="stylesheet" href="globals.css">');
  expect(result).not.toContain("<style");
  expect(result).toContain("globals.css");
});
