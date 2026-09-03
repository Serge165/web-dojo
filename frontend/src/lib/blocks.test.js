import { featureBoxesTemplate, FEATURE_BOX_ITEMS } from "./blocks";

describe("featureBoxesTemplate", () => {
  test("renders exactly N cards and titles for a count within range", () => {
    const html = featureBoxesTemplate(5);
    expect((html.match(/<button /g) || []).length).toBe(5);
    for (const item of FEATURE_BOX_ITEMS.slice(0, 5)) {
      expect(html).toContain(item.title);
    }
    expect(html).not.toContain(FEATURE_BOX_ITEMS[5].title);
  });

  test("clamps below 2 up to 2 and above 8 down to 8", () => {
    expect((featureBoxesTemplate(0).match(/<button /g) || []).length).toBe(2);
    expect((featureBoxesTemplate(20).match(/<button /g) || []).length).toBe(8);
  });

  test("caps grid columns at 4 even when card count is higher", () => {
    expect(featureBoxesTemplate(8)).toContain("repeat(4,1fr)");
    expect(featureBoxesTemplate(3)).toContain("repeat(3,1fr)");
  });

  test("centers each card's contents so single-column mobile stacking looks right", () => {
    const html = featureBoxesTemplate(3);
    const cardCount = (html.match(/text-align:center/g) || []).length;
    expect(cardCount).toBe(3 + 1); // 3 cards + the heading
    expect(html).toContain("margin:0 auto 14px");
  });
});
