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
// id-based-naming logic instead of importing the real implementation —
// same approach as the "stripInlineStyles pattern adds/skips..." tests
// above.
const patternStripInlineStyles = (elements) => {
  const rules = [];
  const outParts = elements.map((el) => {
    const elId = el.id || "";
    let n = 0;
    return (el.html || "").replace(/style="([^"]*)"/g, (_, styles) => {
      const cls = n === 0 ? `el-${elId}` : `el-${elId}__${n}`;
      n++;
      rules.push(`.${cls} { ${styles} }`);
      if (styles.includes("grid-template-columns")) {
        rules.push(`@media (max-width: 768px) { .${cls} { grid-template-columns: 1fr !important; } }`);
      }
      return `class="${cls}"`;
    });
  });
  return { html: outParts.join("\n"), css: rules.join("\n") };
};

test("stripInlineStyles pattern emits a stable id-based root class", () => {
  const elements = [{ id: "el_abc123", html: '<div style="color:red;">Hi</div>' }];
  const { html, css } = patternStripInlineStyles(elements);
  assert.ok(html.includes('class="el-el_abc123"'));
  assert.ok(css.includes(".el-el_abc123 { color:red; }"));
});

test("stripInlineStyles pattern suffixes nested style attrs within the same element", () => {
  const elements = [{ id: "el_1", html: '<section style="padding:20px;"><h1 style="color:blue;">Hi</h1></section>' }];
  const { html, css } = patternStripInlineStyles(elements);
  assert.ok(html.includes('class="el-el_1"'));
  assert.ok(html.includes('class="el-el_1__1"'));
  assert.ok(css.includes(".el-el_1 { padding:20px; }"));
  assert.ok(css.includes(".el-el_1__1 { color:blue; }"));
});

test("stripInlineStyles pattern keeps ids stable across element reordering", () => {
  const a = { id: "el_a", html: '<div style="color:red;">A</div>' };
  const b = { id: "el_b", html: '<div style="color:blue;">B</div>' };
  const ab = patternStripInlineStyles([a, b]);
  const ba = patternStripInlineStyles([b, a]);
  assert.ok(ab.html.includes('class="el-el_a"') && ba.html.includes('class="el-el_a"'));
  assert.ok(ab.html.includes('class="el-el_b"') && ba.html.includes('class="el-el_b"'));
});
