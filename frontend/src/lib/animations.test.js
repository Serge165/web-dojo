import {
  ANIMATION_PRESETS, ANIMATION_CATEGORIES, buildAppliedAnimation,
  buildOnScrollCss, buildOnScrollBootstrapScript, ONSCROLL_BOOTSTRAP_MARKER,
} from "./animations";

const onScrollPreset = ANIMATION_PRESETS.find((p) => p.category === "on-scroll");
const regularPreset = ANIMATION_PRESETS.find((p) => p.category === "entrance");
const cfg = (preset) => ({ elementId: "el_1", preset, duration: 0.7, delay: 0, timing: "ease", iteration: "1" });

test("on-scroll category exists with at least one preset", () => {
  expect(ANIMATION_CATEGORIES.some((c) => c.id === "on-scroll")).toBe(true);
  expect(onScrollPreset).toBeTruthy();
});

test("buildAppliedAnimation returns a regular (immediate) result for an entrance preset", () => {
  const applied = buildAppliedAnimation(cfg(regularPreset));
  expect(applied.onScroll).toBe(false);
  expect(applied.styleBlock).toContain("@keyframes");
  expect(applied.shorthand).toMatch(/^forge_/);
});

test("buildAppliedAnimation returns an on-scroll result for an on-scroll preset, with no shorthand", () => {
  const applied = buildAppliedAnimation(cfg(onScrollPreset));
  expect(applied.onScroll).toBe(true);
  expect(applied.shorthand).toBeUndefined();
  expect(applied.styleBlock).toContain("@keyframes");
  expect(applied.styleBlock).toContain(".wd-onscroll-hidden[data-forge-el-id=\"el_1\"]");
  expect(applied.styleBlock).toContain(".wd-inview[data-forge-el-id=\"el_1\"]");
});

test("two calls to buildAppliedAnimation never produce the same keyframes name", () => {
  const a = buildAppliedAnimation(cfg(onScrollPreset));
  const b = buildAppliedAnimation(cfg(onScrollPreset));
  const nameOf = (block) => block.match(/@keyframes (\S+)/)[1];
  expect(nameOf(a.styleBlock)).not.toBe(nameOf(b.styleBlock));
});

test("buildOnScrollCss's hidden state mirrors the preset's own 0% frame", () => {
  const css = buildOnScrollCss({ name: "forge_test", elementId: "el_2", frames: onScrollPreset.frames, duration: 0.5, timing: "ease", delay: 0, iteration: "1" });
  const zeroFrame = onScrollPreset.frames["0%"];
  Object.entries(zeroFrame).forEach(([prop, value]) => {
    expect(css).toContain(`${prop}: ${value};`);
  });
});

test("buildOnScrollBootstrapScript is a single self-contained script carrying its own dedupe marker", () => {
  const script = buildOnScrollBootstrapScript();
  expect(script).toContain(`<script ${ONSCROLL_BOOTSTRAP_MARKER}="1">`);
  expect(script).toContain("IntersectionObserver");
  expect(script).toContain("data-wd-onscroll");
  expect(script).toContain("wd-onscroll-hidden");
  expect(script).toContain("wd-inview");
});
