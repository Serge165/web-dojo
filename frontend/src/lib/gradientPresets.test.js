import { GRADIENT_PRESETS, GRADIENT_PRESET_CATEGORIES } from "./gradientPresets";

test("every preset has a unique id and a valid stop/type shape GradientMixer can load", () => {
  const ids = GRADIENT_PRESETS.map((p) => p.id);
  expect(new Set(ids).size).toBe(ids.length);
  GRADIENT_PRESETS.forEach((p) => {
    expect(["linear", "radial"]).toContain(p.type);
    expect(p.stops.length).toBeGreaterThanOrEqual(2);
    p.stops.forEach((st) => {
      expect(st.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(st.position).toBeGreaterThanOrEqual(0);
      expect(st.position).toBeLessThanOrEqual(100);
    });
  });
});

test("categories are derived from the actual preset data, not hand-maintained separately", () => {
  expect(GRADIENT_PRESET_CATEGORIES.length).toBeGreaterThan(3);
  GRADIENT_PRESETS.forEach((p) => expect(GRADIENT_PRESET_CATEGORIES).toContain(p.category));
});
