import { PATTERN_PRESETS, PATTERN_PRESET_CATEGORIES } from "./patternPresets";

const args = { c1: "#111111", c2: "#eeeeee", size: 24 };

test("every preset has a unique id and a build() that returns a non-empty CSS string with both colors present", () => {
  const ids = PATTERN_PRESETS.map((p) => p.id);
  expect(new Set(ids).size).toBe(ids.length);
  PATTERN_PRESETS.forEach((p) => {
    const css = p.build(args);
    expect(typeof css).toBe("string");
    expect(css.length).toBeGreaterThan(0);
    expect(css).toContain(args.c1);
    expect(css).toContain(args.c2);
    expect(p.defaultSize).toBeGreaterThan(0);
  });
});

test("build() scales with size — a different size produces different CSS", () => {
  PATTERN_PRESETS.forEach((p) => {
    expect(p.build({ ...args, size: 24 })).not.toBe(p.build({ ...args, size: 48 }));
  });
});

test("categories are derived from the actual preset data", () => {
  expect(PATTERN_PRESET_CATEGORIES.length).toBeGreaterThan(2);
  PATTERN_PRESETS.forEach((p) => expect(PATTERN_PRESET_CATEGORIES).toContain(p.category));
});
