// frontend/scripts/migrate-block-regions.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { markHeading, markContentRegion } from "./migrate-block-regions.mjs";

test("markHeading adds block-heading to the first h1", () => {
  const input = '<section class="block hero-1 block-hero"><h1 class="block hero-2 block-hero">Hi</h1><p class="block hero-3 block-hero">Sub</p></section>';
  const { html, changed } = markHeading(input);
  assert.ok(changed);
  assert.match(html, /<h1 class="block hero-2 block-hero block-heading">Hi<\/h1>/);
});

test("markHeading adds block-heading to the first h2 when no h1 exists", () => {
  const input = '<section class="block"><h2 class="block x-1">Gallery</h2></section>';
  const { html, changed } = markHeading(input);
  assert.ok(changed);
  assert.match(html, /<h2 class="block x-1 block-heading">Gallery<\/h2>/);
});

test("markHeading is a no-op when no heading element exists", () => {
  const input = '<footer class="block ft-1"><p class="block ft-2">Copyright</p></footer>';
  const { html, changed } = markHeading(input);
  assert.equal(changed, false);
  assert.equal(html, input);
});

test("markHeading skips nav and footer blocks entirely", () => {
  const input = '<nav class="block nav-1"><h1 class="block nav-2">Should not be tagged</h1></nav>';
  const { html, changed } = markHeading(input);
  assert.equal(changed, false);
  assert.equal(html, input);
});

test("markHeading is idempotent", () => {
  const input = '<section class="block hero-1"><h1 class="block hero-2">Hi</h1></section>';
  const once = markHeading(input).html;
  const twice = markHeading(once).html;
  assert.equal(once, twice);
});

test("markContentRegion tags the image grid div for a gallery block", () => {
  const input = '<section class="block cmp-gallery-grid-1 block-cmp-gallery-grid"><div class="block cmp-gallery-grid-2 block-cmp-gallery-grid"><h2 class="block cmp-gallery-grid-3 block-cmp-gallery-grid">Gallery</h2><div class="block cmp-gallery-grid-4 block-cmp-gallery-grid"><img src="a.jpg" class="block cmp-gallery-grid-5 block-cmp-gallery-grid"/><img src="b.jpg" class="block cmp-gallery-grid-6 block-cmp-gallery-grid"/><img src="c.jpg" class="block cmp-gallery-grid-7 block-cmp-gallery-grid"/></div></div></section>';
  const { html, changed, reason } = markContentRegion(input, "cmp-gallery-grid");
  assert.ok(changed, reason);
  assert.match(html, /class="block cmp-gallery-grid-4 block-cmp-gallery-grid container block cmp-gallery-grid"/);
});

test("markContentRegion tags the <ol> for a timeline block", () => {
  const input = '<section class="block cmp-timeline-vert-1"><ol class="block cmp-timeline-vert-2"><li>One</li><li>Two</li></ol></section>';
  const { html, changed } = markContentRegion(input, "cmp-timeline-vert");
  assert.ok(changed);
  assert.match(html, /<ol class="block cmp-timeline-vert-2 container block cmp-timeline-vert">/);
});

test("markContentRegion reports and skips a block it can't confidently classify", () => {
  const input = '<section class="block hero-1"><h1 class="block hero-2">Hi</h1></section>';
  const { changed, reason } = markContentRegion(input, "hero-1");
  assert.equal(changed, false);
  assert.match(reason, /no gallery\/timeline\/bento content found/);
});
