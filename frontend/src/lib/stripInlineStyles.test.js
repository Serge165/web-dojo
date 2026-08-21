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
