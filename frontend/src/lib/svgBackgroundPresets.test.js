import { SVG_BG_PRESETS, SVG_BG_PRESET_CATEGORIES } from "./svgBackgroundPresets";

const args = { c1: "#ff0000", c2: "#0000ff", size: 200 };

test("every preset has a unique id and build() returns a data: URI wrapped background value", () => {
  const ids = SVG_BG_PRESETS.map((p) => p.id);
  expect(new Set(ids).size).toBe(ids.length);
  SVG_BG_PRESETS.forEach((p) => {
    const css = p.build(args);
    expect(css).toContain('url("data:image/svg+xml,');
    expect(css).toContain(encodeURIComponent(args.c1));
    expect(p.defaultSize).toBeGreaterThan(0);
  });
});

test("noise-grain's internal filter#n reference survives encodeURIComponent as a literal, single-encoded #", () => {
  const preset = SVG_BG_PRESETS.find((p) => p.id === "noise-grain");
  const css = preset.build(args);
  expect(css).toContain("url(%23n)");
  expect(css).not.toContain("%2523n");
});

test("categories are derived from the actual preset data", () => {
  expect(SVG_BG_PRESET_CATEGORIES.length).toBeGreaterThan(2);
  SVG_BG_PRESETS.forEach((p) => expect(SVG_BG_PRESET_CATEGORIES).toContain(p.category));
});
