import { PAGE_LAYOUTS, CATEGORY_ORDER, CATEGORY_META } from "./pageLayouts";
import { hasZeneroWidget } from "./zeneroWidgets";

describe("Landing page layout", () => {
  const layout = PAGE_LAYOUTS.find((l) => l.id === "landing-page");

  test("is registered under a Landing category the Add-a-page picker can list", () => {
    expect(layout).toBeTruthy();
    expect(CATEGORY_ORDER).toContain("Landing");
    expect(CATEGORY_META.Landing).toBeTruthy();
    expect(layout.category).toBe("Landing");
  });

  test("carries funnel-tracking checkpoints (entry, checkpoint_a, checkpoint_b, conversion)", () => {
    const html = layout.blocks.join("\n");
    for (const checkpoint of ["entry", "checkpoint_a", "checkpoint_b", "conversion"]) {
      expect(html).toContain(`data-funnel-checkpoint="${checkpoint}"`);
    }
    expect(html).toContain("data-funnel-form");
    expect(html).toContain("/api/funnels/");
  });

  test("ships with a live Zenero content block, not just static placeholder copy", () => {
    const elements = layout.blocks.map((html) => ({ html }));
    expect(hasZeneroWidget(elements)).toBe(true);
  });
});

describe("Gallery page layout", () => {
  const layout = PAGE_LAYOUTS.find((l) => l.id === "gallery-live");

  test("is registered under a Gallery category the Add-a-page picker can list", () => {
    expect(layout).toBeTruthy();
    expect(CATEGORY_ORDER).toContain("Gallery");
    expect(CATEGORY_META.Gallery).toBeTruthy();
    expect(layout.category).toBe("Gallery");
  });

  test("its gallery grid is dashboard-managed (Zenero gallery widget), not a hardcoded image list", () => {
    const elements = layout.blocks.map((html) => ({ html }));
    expect(hasZeneroWidget(elements)).toBe(true);
    expect(layout.blocks.join("\n")).toContain('data-forge-widget="gallery"');
  });
});
