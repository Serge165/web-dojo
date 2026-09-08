import { test } from "node:test";
import assert from "node:assert/strict";
import { wrapBackgroundImageVars } from "./wrap-block-bg-vars.mjs";

test("wraps a simple background-image url() in var(--block-bg-image, ...)", () => {
  const input = ".foo { background-image:url(https://x.test/a.jpg); }";
  const out = wrapBackgroundImageVars(input);
  assert.equal(out, ".foo { background-image:var(--block-bg-image, url(https://x.test/a.jpg)); }");
});

test("preserves a scrim gradient layer ahead of the url()", () => {
  const input = ".block-parallax-hero-fullbleed-1 { min-height:100vh;background-image:linear-gradient(rgba(10,15,20,.55),rgba(10,15,20,.55)),url(https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=70);background-attachment:fixed; }";
  const out = wrapBackgroundImageVars(input);
  assert.equal(
    out,
    ".block-parallax-hero-fullbleed-1 { min-height:100vh;background-image:linear-gradient(rgba(10,15,20,.55),rgba(10,15,20,.55)),var(--block-bg-image, url(https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=70));background-attachment:fixed; }",
  );
});

test("is idempotent — running twice does not double-wrap", () => {
  const input = ".foo { background-image:url(https://x.test/a.jpg); }";
  const once = wrapBackgroundImageVars(input);
  const twice = wrapBackgroundImageVars(once);
  assert.equal(once, twice);
});

test("leaves declarations with no background-image untouched", () => {
  const input = ".foo { color:red;padding:8px; }";
  assert.equal(wrapBackgroundImageVars(input), input);
});
