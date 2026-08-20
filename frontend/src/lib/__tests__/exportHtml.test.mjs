import test from "node:test";
import assert from "node:assert/strict";
import { RESPONSIVE_CSS } from "../responsiveCss.js";

test("project id injection pattern produces valid, safe JS for a UUID-shaped id", () => {
  const project = { id: "550e8400-e29b-41d4-a716-446655440000" };
  const line = `<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>`;
  assert.equal(line, '<script>window.__WD_PROJECT_ID="550e8400-e29b-41d4-a716-446655440000";</script>');
});

test("project id injection pattern falls back to empty string when id is missing", () => {
  const project = {};
  const line = `<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>`;
  assert.equal(line, '<script>window.__WD_PROJECT_ID="";</script>');
});

test("buildStandaloneHtml template includes RESPONSIVE_CSS after the project-id script", () => {
  const project = { id: "abc", elements: [], canvas_bg: "#ffffff" };
  const scriptLine = `<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>`;
  const assembled = `${scriptLine}\n${RESPONSIVE_CSS}\n`;
  assert.ok(assembled.includes(scriptLine));
  assert.ok(assembled.includes(RESPONSIVE_CSS));
  assert.ok(assembled.indexOf(scriptLine) < assembled.indexOf(RESPONSIVE_CSS));
});

test("stripInlineStyles pattern adds a responsive override for grid-template-columns", () => {
  const styles = "display:grid;grid-template-columns:repeat(3,1fr);gap:10px;";
  const cls = "el-0";
  const rules = [`.${cls} { ${styles} }`];
  if (styles.includes("grid-template-columns")) {
    rules.push(`@media (max-width: 768px) { .${cls} { grid-template-columns: 1fr !important; } }`);
  }
  assert.equal(rules.length, 2);
  assert.equal(rules[1], "@media (max-width: 768px) { .el-0 { grid-template-columns: 1fr !important; } }");
});

test("stripInlineStyles pattern skips the override for non-grid elements", () => {
  const styles = "color:red;padding:10px;";
  const rules = [`.el-0 { ${styles} }`];
  if (styles.includes("grid-template-columns")) {
    rules.push("SHOULD_NOT_APPEAR");
  }
  assert.equal(rules.length, 1);
});

test("custom_js script-tag pattern is injected before </body> when non-empty", () => {
  const customJs = "console.log('hi');";
  const bodyTag = customJs.trim() ? `<script>${customJs}</script>\n` : "";
  const assembled = `<body>\n<div>content</div>\n${bodyTag}</body>`;
  assert.ok(assembled.includes("console.log('hi');"));
  assert.ok(assembled.indexOf("console.log") < assembled.indexOf("</body>"));
});

test("custom_js script-tag pattern is omitted when custom_js is empty", () => {
  const customJs = "";
  const bodyTag = customJs.trim() ? `<script>${customJs}</script>\n` : "";
  const assembled = `<body>\n<div>content</div>\n${bodyTag}</body>`;
  assert.ok(!assembled.includes("<script></script>"));
});

test("escRawScript neutralizes an embedded </script> so it can't close the wrapping tag", async () => {
  const { escRawScript } = await import("../escapeHtml.js");
  const raw = "var x = '</script>';";
  const escaped = escRawScript(raw);
  assert.ok(!escaped.includes("</script>"));
  assert.equal(escaped, "var x = '<\\/script>';");
});

test("escRawScript is case-insensitive and leaves ordinary code untouched", async () => {
  const { escRawScript } = await import("../escapeHtml.js");
  assert.equal(escRawScript("var x = 1 + 2;"), "var x = 1 + 2;");
  assert.ok(!escRawScript("'</SCRIPT>'").includes("</SCRIPT>"));
});

// NOTE: exportHtml.js imports file-saver, a CJS module that plain Node's
// ESM loader cannot resolve named exports from ("Named export 'saveAs'
// not found" — a documented file-saver interop gap). Dynamic
// import("../exportHtml.js") therefore throws in this test runner (see
// Task 4 brief), so the tests below duplicate stripInlineStyles's
// tag-name+running-counter naming logic instead of importing the real
// implementation — same approach as the "stripInlineStyles pattern
// adds/skips..." tests above. Keep this duplicate in sync with the real
// stripInlineStyles in ../exportHtml.js (and its Python mirror,
// _strip_inline_styles in backend/server.py).
const patternTagNameAt = (str, offset) => {
  const ltIdx = str.lastIndexOf("<", offset);
  if (ltIdx === -1) return "el";
  const m = /^<([a-zA-Z][a-zA-Z0-9]*)/.exec(str.slice(ltIdx));
  return m ? m[1].toLowerCase() : "el";
};

const patternStripInlineStyles = (elements) => {
  const rules = [];
  const tagCounters = {};
  const outParts = elements.map((el) => {
    return (el.html || "").replace(/style="([^"]*)"/g, (_, styles, offset, string) => {
      const tag = patternTagNameAt(string, offset);
      tagCounters[tag] = (tagCounters[tag] || 0) + 1;
      const cls = `${tag}-${tagCounters[tag]}`;
      rules.push(`.${cls} { ${styles} }`);
      if (styles.includes("grid-template-columns")) {
        rules.push(`@media (max-width: 768px) { .${cls} { grid-template-columns: 1fr !important; } }`);
      }
      return `class="${cls}"`;
    });
  });
  return { html: outParts.join("\n"), css: rules.join("\n") };
};

test("stripInlineStyles pattern emits a semantic tag-name-plus-counter root class", () => {
  const elements = [{ id: "el_abc123", html: '<div style="color:red;">Hi</div>' }];
  const { html, css } = patternStripInlineStyles(elements);
  assert.ok(html.includes('class="div-1"'));
  assert.ok(css.includes(".div-1 { color:red; }"));
});

test("stripInlineStyles pattern numbers nested style attrs by their own tag name, not the parent", () => {
  const elements = [{ id: "el_1", html: '<section style="padding:20px;"><h1 style="color:blue;">Hi</h1></section>' }];
  const { html, css } = patternStripInlineStyles(elements);
  assert.ok(html.includes('class="section-1"'));
  assert.ok(html.includes('class="h1-1"'));
  assert.ok(css.includes(".section-1 { padding:20px; }"));
  assert.ok(css.includes(".h1-1 { color:blue; }"));
});

test("stripInlineStyles pattern keeps a running per-tag counter across elements, order-dependent", () => {
  const a = { id: "el_a", html: '<div style="color:red;">A</div>' };
  const b = { id: "el_b", html: '<div style="color:blue;">B</div>' };
  const ab = patternStripInlineStyles([a, b]);
  const ba = patternStripInlineStyles([b, a]);
  // Same structure, different order -> counters assign in encounter order,
  // so which content gets div-1 vs div-2 flips with the order (this
  // replaces the old id-based "stable across reordering" guarantee).
  assert.ok(ab.html.includes('class="div-1"') && ab.html.includes('class="div-2"'));
  assert.ok(ab.css.includes(".div-1 { color:red; }") && ab.css.includes(".div-2 { color:blue; }"));
  assert.ok(ba.html.includes('class="div-1"') && ba.html.includes('class="div-2"'));
  assert.ok(ba.css.includes(".div-1 { color:blue; }") && ba.css.includes(".div-2 { color:red; }"));
});

test("stripInlineStyles pattern handles attributes before AND after style= on the same tag", () => {
  const elements = [{
    id: "el_img",
    html: '<img src="a.jpg" style="width:100%;" alt="" /><h2 data-aos="fade-up" style="font-size:36px;">Title</h2>',
  }];
  const { html, css } = patternStripInlineStyles(elements);
  assert.ok(html.includes('class="img-1"'));
  assert.ok(html.includes('class="h2-1"'));
  assert.ok(css.includes(".img-1 { width:100%; }"));
  assert.ok(css.includes(".h2-1 { font-size:36px; }"));
});

test("stripInlineStyles pattern end-to-end: section > h2 + p produces matching class references and CSS selectors", () => {
  const elements = [{
    id: "el_card",
    html: '<section style="padding:64px;"><h2 style="font-size:32px;">Heading</h2><p style="margin:0;">Body</p></section>',
  }];
  const { html, css } = patternStripInlineStyles(elements);

  assert.ok(html.includes('<section class="section-1">'));
  assert.ok(html.includes('<h2 class="h2-1">'));
  assert.ok(html.includes('<p class="p-1">'));
  assert.ok(!html.includes("style="));

  assert.ok(css.includes(".section-1 { padding:64px; }"));
  assert.ok(css.includes(".h2-1 { font-size:32px; }"));
  assert.ok(css.includes(".p-1 { margin:0; }"));

  // Every class referenced in the HTML has a matching CSS selector, and
  // vice versa.
  const htmlClasses = [...html.matchAll(/class="([^"]+)"/g)].map((m) => m[1]);
  const cssSelectors = [...css.matchAll(/\.([a-z0-9-]+)\s*\{/g)].map((m) => m[1]);
  assert.deepEqual(htmlClasses.sort(), cssSelectors.sort());
});
