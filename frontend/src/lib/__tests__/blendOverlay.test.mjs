import test from "node:test";
import assert from "node:assert/strict";

// BlendPanel.jsx is JSX and can't be imported by plain Node, so this
// duplicates its OVERLAY_RE + addOverlay reconciliation logic exactly, the
// same pattern-testing approach used elsewhere in this codebase for
// untestable JSX files (see exportHtml.test.mjs).
const OVERLAY_RE = /^<div style="position:relative;overflow:hidden;" data-wd-overlay="1">([\s\S]*)<div style="position:absolute;inset:0;background:[^;]*;mix-blend-mode:[^;]*;pointer-events:none;"><\/div><\/div>$/;

const addOverlay = (currentHtml, overlayColor, overlayMode) => {
  const existing = currentHtml.match(OVERLAY_RE);
  const inner = existing ? existing[1] : currentHtml;
  return `<div style="position:relative;overflow:hidden;" data-wd-overlay="1">${inner}<div style="position:absolute;inset:0;background:${overlayColor};mix-blend-mode:${overlayMode};pointer-events:none;"></div></div>`;
};

test("first application wraps the original content once", () => {
  const original = '<img src="x.jpg" alt="" />';
  const result = addOverlay(original, "#4f46e5", "multiply");
  assert.equal(
    result,
    '<div style="position:relative;overflow:hidden;" data-wd-overlay="1"><img src="x.jpg" alt="" /><div style="position:absolute;inset:0;background:#4f46e5;mix-blend-mode:multiply;pointer-events:none;"></div></div>'
  );
});

test("second application replaces the overlay instead of nesting a second wrapper", () => {
  const original = '<img src="x.jpg" alt="" />';
  const afterFirst = addOverlay(original, "#4f46e5", "multiply");
  const afterSecond = addOverlay(afterFirst, "#ff0000", "screen");

  // Must NOT contain two "position:relative;overflow:hidden" wrappers.
  const wrapperCount = (afterSecond.match(/position:relative;overflow:hidden/g) || []).length;
  assert.equal(wrapperCount, 1, "must not nest a second wrapper");

  // Must NOT contain the stale first overlay's color/mode.
  assert.ok(!afterSecond.includes("#4f46e5"));
  assert.ok(!afterSecond.includes("mix-blend-mode:multiply"));

  // Must contain the new overlay's color/mode, wrapping the ORIGINAL inner content.
  assert.equal(
    afterSecond,
    '<div style="position:relative;overflow:hidden;" data-wd-overlay="1"><img src="x.jpg" alt="" /><div style="position:absolute;inset:0;background:#ff0000;mix-blend-mode:screen;pointer-events:none;"></div></div>'
  );
});

test("third application still doesn't nest — idempotent under repeated clicks", () => {
  const original = '<div style="padding:10px;"><h1>Title</h1><p>Body text</p></div>';
  let html = original;
  for (let i = 0; i < 3; i++) {
    html = addOverlay(html, `#${i}${i}${i}${i}${i}${i}`, "normal");
  }
  const wrapperCount = (html.match(/position:relative;overflow:hidden/g) || []).length;
  assert.equal(wrapperCount, 1, "must not nest after 3 repeated applications");
  assert.ok(html.includes("<h1>Title</h1>"), "original inner content must survive");
  assert.ok(html.includes("<p>Body text</p>"), "original inner content must survive");
});

test("regex correctly finds the trailing overlay div even when inner content has nested divs", () => {
  const original = '<div class="card"><div class="inner"><span>nested</span></div></div>';
  const afterFirst = addOverlay(original, "#111111", "darken");
  const afterSecond = addOverlay(afterFirst, "#222222", "lighten");
  const wrapperCount = (afterSecond.match(/position:relative;overflow:hidden/g) || []).length;
  assert.equal(wrapperCount, 1);
  assert.ok(afterSecond.includes('<div class="inner"><span>nested</span></div>'));
});
