import test from "node:test";
import assert from "node:assert/strict";
import { parseCssPane, applyCssPaneToElement, reconcileElementsFromCss } from "../cssPaneSync.js";
import { stripInlineStyles } from "../stripInlineStyles.js";

// parseCssPane now needs the current `elements` array to regenerate the
// same tag+counter class assignment stripInlineStyles would produce for
// it (semantic classes like .div-1 don't encode the element id the way
// the old .el-<id> scheme did), so every test below supplies one.

test("parseCssPane reads a single root rule", () => {
  const elements = [{ id: "el_abc123", html: '<div style="color:red;">Hi</div>' }];
  const css = ".div-1 { color: red; padding: 4px; }";
  const parsed = parseCssPane(css, elements);
  assert.deepEqual(parsed.get("el_abc123"), ["color: red; padding: 4px;"]);
});

test("parseCssPane reads a root rule plus nested-occurrence rules in order", () => {
  const elements = [{
    id: "el_1",
    html: '<section style="padding:20px;"><h1 style="color:red;"><span style="margin:0;">Hi</span></h1></section>',
  }];
  const css = `
.section-1 { padding: 20px; }
.h1-1 { color: blue; }
.span-1 { margin: 0; }
`;
  const parsed = parseCssPane(css, elements);
  assert.deepEqual(parsed.get("el_1"), ["padding: 20px;", "color: blue;", "margin: 0;"]);
});

test("parseCssPane handles multiple elements independently", () => {
  const elements = [
    { id: "el_a", html: '<div style="color:red;">A</div>' },
    { id: "el_b", html: '<p style="color:blue;">B</p>' },
  ];
  const css = ".div-1 { color: red; }\n.p-1 { color: blue; }";
  const parsed = parseCssPane(css, elements);
  assert.deepEqual(parsed.get("el_a"), ["color: red;"]);
  assert.deepEqual(parsed.get("el_b"), ["color: blue;"]);
});

test("parseCssPane skips a class it doesn't recognize for the given elements", () => {
  const elements = [{ id: "el_a", html: '<div style="color:red;">A</div>' }];
  const css = ".div-1 { color: green; }\n.made-up-selector { color: hotpink; }";
  const parsed = parseCssPane(css, elements);
  assert.deepEqual(parsed.get("el_a"), ["color: green;"]);
  assert.equal(parsed.size, 1);
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
    { id: "el_b", html: '<p style="color:blue;">B</p>' },
  ];
  const css = ".div-1 { color: green; }";
  const next = reconcileElementsFromCss(elements, css);
  assert.equal(next[0].html, '<div style="color: green;">A</div>');
  assert.equal(next[1].html, '<p style="color:blue;">B</p>'); // unchanged, no rule for el_b
});

test("round-trips through the real stripInlineStyles output", () => {
  const elements = [
    { id: "el_x", html: '<section style="padding:64px;"><h2 style="color:#111111;">Title</h2></section>' },
  ];
  const { html: cleanedHtml, css } = stripInlineStyles(elements);
  assert.match(cleanedHtml, /class="section-1"/);
  assert.match(cleanedHtml, /class="h2-1"/);

  const editedCss = css.replace("color:#111111;", "color:#222222;");
  const next = reconcileElementsFromCss(elements, editedCss);
  assert.match(next[0].html, /color:#222222;/);
  assert.match(next[0].html, /padding:64px;/); // untouched occurrence preserved
});

// ===== Phase 4a: semantic block-* class round-trips =====

test("round-trips semantic block-* classes back to the right occurrence", () => {
  const elements = [{
    id: "el_block",
    html: '<section data-wd-cat="heroes" data-wd-block="hero-centered" style="padding:64px;"><h2 style="color:#111111;">Title</h2></section>',
  }];
  const { html: cleanedHtml, css } = stripInlineStyles(elements);
  assert.match(cleanedHtml, /class="block block-heroes-centered-1 block-heroes-centered"/);
  assert.match(cleanedHtml, /class="block block-heroes-centered-2 block-heroes-centered"/);

  // Edit the SECOND occurrence's color in the pane; occurrence 0 must stay intact.
  const editedCss = css.replace("color:#111111;", "color:#222222;");
  const next = reconcileElementsFromCss(elements, editedCss);
  assert.match(next[0].html, /color:#222222;/);   // h2 updated
  assert.match(next[0].html, /padding:64px;/);     // section (occurrence 0) untouched
});

test("parseCssPane skips a hand-typed bare marker rule (the override hook has no write-back)", () => {
  const elements = [{ id: "el_b", html: '<section data-wd-cat="heroes" data-wd-block="hero-centered" style="padding:8px;">H</section>' }];
  // The suffixed class maps to occurrence 0; the bare marker is NOT in classMap.
  const css = ".block-heroes-centered { color: red; }\n.block-heroes-centered-1 { padding: 8px; }";
  const parsed = parseCssPane(css, elements);
  assert.deepEqual(parsed.get("el_b"), ["padding: 8px;"]); // only the suffixed rule wrote back
  assert.equal(parsed.size, 1);                            // the marker rule was skipped
});

