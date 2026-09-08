import { stripInlineStyles } from "./stripInlineStyles";

const el = (id, html) => ({ id, html });

test("stripInlineStyles extracts inline styles into classes named by tag + counter", () => {
  const { html, css } = stripInlineStyles([el("a", '<nav style="padding:8px">Hi</nav>')]);
  expect(html).toBe('<nav class="nav-1">Hi</nav>');
  expect(css).toBe(".nav-1 { padding:8px }");
});

test("stripInlineStyles scopes the counter across all elements, not per-element", () => {
  const { html } = stripInlineStyles([
    el("a", '<h2 style="color:red">A</h2>'),
    el("b", '<h2 style="color:blue">B</h2>'),
  ]);
  expect(html).toContain('class="h2-1"');
  expect(html).toContain('class="h2-2"');
});

test("stripInlineStyles applies an optional class prefix (for multi-page exports sharing one stylesheet)", () => {
  const { html, css } = stripInlineStyles([el("a", '<nav style="padding:8px">Hi</nav>')], "about-");
  expect(html).toBe('<nav class="about-nav-1">Hi</nav>');
  expect(css).toBe(".about-nav-1 { padding:8px }");
});

test("stripInlineStyles with different prefixes keeps two pages' identical tag structure from colliding", () => {
  const page1 = stripInlineStyles([el("a", '<nav style="padding:8px">Home</nav>')], "index-");
  const page2 = stripInlineStyles([el("b", '<nav style="padding:16px">About</nav>')], "about-");
  const combinedCss = `${page1.css}\n${page2.css}`;
  expect(combinedCss).toContain(".index-nav-1 { padding:8px }");
  expect(combinedCss).toContain(".about-nav-1 { padding:16px }");
});

test("stripInlineStyles adds tablet + mobile responsive overrides for grid-template-columns rules", () => {
  const { css, componentCss, mediaCss } = stripInlineStyles([el("a", '<div style="display:grid;grid-template-columns:repeat(3,1fr)">Hi</div>')]);
  expect(mediaCss).toContain("@media (max-width: 1024px)");
  expect(mediaCss).toContain("@media (max-width: 767px)");
  expect(mediaCss).toContain("grid-template-columns: 1fr !important");
  expect(componentCss).not.toContain("@media");
  expect(css).toBe(`${componentCss}\n${mediaCss}`);
});

test("stripInlineStyles returns a classMap keyed by class name", () => {
  const { classMap } = stripInlineStyles([el("el1", '<p style="margin:0">A</p><span style="margin:1px">B</span>')]);
  expect(classMap.get("p-1")).toEqual({ elementId: "el1", occurrence: 0 });
  expect(classMap.get("span-1")).toEqual({ elementId: "el1", occurrence: 1 });
});

// ===== Phase 4a: semantic block-<cat>-<slug> classes for data-wd-* stamped blocks =====

test("stripInlineStyles emits semantic block-<cat>-<slug>-<occ> + shared marker for data-wd-cat/data-wd-block elements", () => {
  const html = '<section data-wd-cat="heroes" data-wd-block="hero-centered" style="padding:64px;"><h2 style="color:#111;">T</h2></section>';
  const { html: out, css, classMap } = stripInlineStyles([el("el1", html)]);
  // First occurrence (section root): suffixed class + unprefixed marker.
  expect(out).toContain('class="block block-heroes-centered-1 block-heroes-centered"');
  // Second occurrence (h2): suffixed class (occ=2) + same marker.
  expect(out).toContain('class="block block-heroes-centered-2 block-heroes-centered"');
  // Rules are per-occurrence suffixed only.
  expect(css).toContain(".block-heroes-centered-1 { padding:64px; }");
  expect(css).toContain(".block-heroes-centered-2 { color:#111; }");
  // No rule is emitted for the bare marker — it's an override hook only.
  expect(css).not.toMatch(/\.block-heroes-centered \{/);
  // classMap keys the suffixed class (cssPaneSync write-back), NOT the marker.
  expect(classMap.get("block-heroes-centered-1")).toEqual({ elementId: "el1", occurrence: 0 });
  expect(classMap.get("block-heroes-centered-2")).toEqual({ elementId: "el1", occurrence: 1 });
  expect(classMap.get("block-heroes-centered")).toBeUndefined();
});

test("stripInlineStyles strips the category prefix from the block id to form the slug (nav- + navbars => block-navbars-mega)", () => {
  const html = '<nav data-wd-cat="navbars" data-wd-block="nav-mega" style="padding:8px;">N</nav>';
  const { html: out, css } = stripInlineStyles([el("el1", html)]);
  expect(out).toContain('class="block block-navbars-mega-1 block-navbars-mega"');
  expect(css).toContain(".block-navbars-mega-1 { padding:8px; }");
});

test("stripInlineStyles still falls back to tag+counter for elements without the data-wd-* pair (user-authored markup)", () => {
  const html = '<div style="color:red;">Hi</div>';
  const { html: out, css } = stripInlineStyles([el("el1", html)]);
  expect(out).toBe('<div class="div-1">Hi</div>');
  expect(css).toBe(".div-1 { color:red; }");
});

test("stripInlineStyles leaves <script> payloads verbatim (form-widget style= in JS strings survives)", () => {
  const js = `var s='<div style="padding:16px 0;color:#16a34a;font-weight:600;">Thanks!</div>';`;
  const html = `<div data-wd-cat="components" data-wd-block="cmp-form-1"><form data-form-id="f1"><input name="a"></form><script>(function(){${js}})();</` + `script><p style="margin:0;">Copy</p></div>`;
  const { html: out, css } = stripInlineStyles([el("el1", html)]);
  // The script segment is byte-identical — its style="…" was code, not markup.
  expect(out).toContain(js);
  // The real markup got classed — semantic path: the element's root carries
  // the data-wd-* pair, so the class is block-<cat>-<slug>-<occ> (+ marker).
  expect(out).toContain('<p class="block block-components-form-1-1 block-components-form-1">Copy</p>');
  // Only the markup rule landed in the CSS — no bogus rule from the script.
  expect(css).toBe(".block-components-form-1-1 { margin:0; }");
});

test("stripInlineStyles still counts occurrences correctly when scripts sit between styled tags", () => {
  const html = '<h2 style="color:red">A</h2><script>var x=1;</' + 'script><p style="margin:0">B</p>';
  const { html: out, classMap } = stripInlineStyles([el("el1", html)]);
  expect(out).toContain('<h2 class="');
  expect(out).toContain('<p class="');
  expect(classMap.get("h2-1")).toEqual({ elementId: "el1", occurrence: 0 });
    expect(classMap.get("p-1")).toEqual({ elementId: "el1", occurrence: 1 });
});

test("stripInlineStyles applies a page prefix to the suffixed semantic class", () => {
  const html = '<section data-wd-cat="heroes" data-wd-block="hero-centered" style="padding:64px;">H</section>';
  const { html: out, css } = stripInlineStyles([el("el1", html)], "about-");
  // Suffixed class carries the page prefix; marker stays unprefixed.
  expect(out).toContain('class="block about-block-heroes-centered-1 block-heroes-centered"');
  // The literal base class `block` is present alongside the marker.
  expect(out).toContain('class="block ');
  expect(css).toContain(".about-block-heroes-centered-1 { padding:64px; }");
  expect(out).toContain(" block-heroes-centered\"");
  expect(out).not.toContain("about-block-heroes-centered\"");
});

test("stripInlineStyles grid responsive override targets the suffixed semantic class", () => {
  const html = '<div data-wd-cat="layout" data-wd-block="layout-bento" style="display:grid;grid-template-columns:repeat(3,1fr);">B</div>';
  const { mediaCss } = stripInlineStyles([el("el1", html)]);
  expect(mediaCss).toContain("@media (max-width: 1024px) { .block-layout-bento-1 { grid-template-columns: 1fr !important; } }");
  expect(mediaCss).toContain("@media (max-width: 767px) { .block-layout-bento-1 { grid-template-columns: 1fr !important; } }");
});

test("stripInlineStyles keeps two pages' same block with different styles distinct (suffixed) while the marker is shared", () => {
  const html = '<nav data-wd-cat="navbars" data-wd-block="nav-simple" style="padding:8px;">Home</nav>';
  const page1 = stripInlineStyles([el("a", html)], "index-");
  const page2 = stripInlineStyles([el("b", html.replace("padding:8px", "padding:16px"))], "about-");
  expect(page1.css).toContain(".index-block-navbars-simple-1 { padding:8px; }");
  expect(page2.css).toContain(".about-block-navbars-simple-1 { padding:16px; }");
  // Both pages' elements carry the same unprefixed marker (shared GEMS hook).
  expect(page1.html).toContain("block-navbars-simple\"");
  expect(page2.html).toContain("block-navbars-simple\"");
});

