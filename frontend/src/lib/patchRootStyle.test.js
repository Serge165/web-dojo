// Phase 7 regression coverage for patchFirstStyle/removeStyleProp targeting
// the block's ROOT tag specifically, not "first style=/first style prop
// anywhere in the html string" (the pre-fix behavior, which broke once
// Phase 4b converted most block root tags from inline style to a class,
// leaving deeper descendants as the only style="..." patchFirstStyle would
// find). See docs/PHASE_4a_HANDOFF.md and Builder.jsx's patchFirstStyle.
import { patchFirstStyle, removeStyleProp } from "./patchRootStyle";

describe("patchFirstStyle", () => {
  it("merges into an existing style on the root tag (un-converted block, backward compatible)", () => {
    const html = '<section style="padding: 20px"><h2>Title</h2></section>';
    const out = patchFirstStyle(html, { background: "red" });
    expect(out).toBe('<section style="padding: 20px; background: red"><h2>Title</h2></section>');
  });

  it("stamps a new style onto the root tag when the root has no style at all", () => {
    const html = "<section><h2>Title</h2></section>";
    const out = patchFirstStyle(html, { background: "red" });
    expect(out).toBe('<section style="background: red"><h2>Title</h2></section>');
  });

  it("targets the ROOT tag, not a styled descendant (the Phase 4b bug)", () => {
    // Root converted to a class (Phase 4b), but a descendant still carries
    // its own inline style — pre-fix patchFirstStyle would wrongly match
    // and recolor the descendant instead of the block the user selected.
    const html = '<section class="block block-hero-centered-1 block-hero-centered"><p style="color: blue">Text</p></section>';
    const out = patchFirstStyle(html, { background: "red" });
    expect(out).toBe(
      '<section style="background: red" class="block block-hero-centered-1 block-hero-centered"><p style="color: blue">Text</p></section>'
    );
    // The descendant's own style must be left untouched.
    expect(out).toContain('<p style="color: blue">Text</p>');
  });

  it("never matches a literal style=\"...\" inside a <script> payload", () => {
    const html =
      '<section class="block block-updates-1 block-updates">' +
      '<script data-forge-js="updates.js">function renderCard(c){return \'<div style="color:\'+c.color+\'">\'+c.text+\'</div>\';}</script>' +
      "</section>";
    const out = patchFirstStyle(html, { background: "red" });
    // Root tag gets the new inline style...
    expect(out.startsWith('<section style="background: red" class="block block-updates-1 block-updates">')).toBe(true);
    // ...and the script payload is byte-identical, untouched.
    expect(out).toContain('function renderCard(c){return \'<div style="color:\'+c.color+\'">\'+c.text+\'</div>\';}');
  });
});

describe("removeStyleProp", () => {
  it("removes the prop from the root tag's style, leaving a descendant's own style alone", () => {
    const html = '<div style="animation: fade 1s; padding: 4px"><span style="animation: spin 1s">x</span></div>';
    const out = removeStyleProp(html, "animation");
    expect(out).toBe('<div style="padding: 4px"><span style="animation: spin 1s">x</span></div>');
  });

  it("is a no-op when the root tag has no style attribute", () => {
    const html = '<div class="block"><span style="animation: spin 1s">x</span></div>';
    expect(removeStyleProp(html, "animation")).toBe(html);
  });
});
