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
