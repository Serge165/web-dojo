import test from "node:test";
import assert from "node:assert/strict";
import { parseCssPane, applyCssPaneToElement, reconcileElementsFromCss } from "../cssPaneSync.js";

test("parseCssPane reads a single root rule", () => {
  const css = ".el-el_abc123 { color: red; padding: 4px; }";
  const parsed = parseCssPane(css);
  assert.deepEqual(parsed.get("el_abc123"), ["color: red; padding: 4px;"]);
});

test("parseCssPane reads a root rule plus nested-occurrence rules in order", () => {
  const css = `
.el-el_1 { padding: 20px; }
.el-el_1__1 { color: blue; }
.el-el_1__2 { margin: 0; }
`;
  const parsed = parseCssPane(css);
  assert.deepEqual(parsed.get("el_1"), ["padding: 20px;", "color: blue;", "margin: 0;"]);
});

test("parseCssPane handles multiple elements independently", () => {
  const css = ".el-el_a { color: red; }\n.el-el_b { color: blue; }";
  const parsed = parseCssPane(css);
  assert.deepEqual(parsed.get("el_a"), ["color: red;"]);
  assert.deepEqual(parsed.get("el_b"), ["color: blue;"]);
});

test("applyCssPaneToElement replaces the root style in place", () => {
  const html = '<div style="color:red;">Hi</div>';
  const out = applyCssPaneToElement(html, ["color: blue;"]);
  assert.equal(out, '<div style="color: blue;">Hi</div>');
});

test("applyCssPaneToElement replaces nested styles by occurrence order", () => {
  const html = '<section style="padding:20px;"><h1 style="color:red;">Hi</h1></section>';
  const out = applyCssPaneToElement(html, ["padding: 8px;", "color: green;"]);
  assert.equal(out, '<section style="padding: 8px;"><h1 style="color: green;">Hi</h1></section>');
});

test("applyCssPaneToElement leaves an occurrence untouched when the pane omitted it", () => {
  const html = '<section style="padding:20px;"><h1 style="color:red;">Hi</h1></section>';
  const declarations = [];
  declarations[1] = "color: green;"; // index 0 deliberately left undefined
  const out = applyCssPaneToElement(html, declarations);
  assert.equal(out, '<section style="padding:20px;"><h1 style="color: green;">Hi</h1></section>');
});

test("reconcileElementsFromCss updates only elements with matching rules", () => {
  const elements = [
    { id: "el_a", html: '<div style="color:red;">A</div>' },
    { id: "el_b", html: '<div style="color:blue;">B</div>' },
  ];
  const css = ".el-el_a { color: green; }";
  const next = reconcileElementsFromCss(elements, css);
  assert.equal(next[0].html, '<div style="color: green;">A</div>');
  assert.equal(next[1].html, '<div style="color:blue;">B</div>'); // unchanged, no rule for el_b
});
