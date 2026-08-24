import {
  truncateForSerp, titleCountColor, truncateDescriptionForSerp, descriptionCountColor,
} from "./seoFieldChecks";

test("truncateForSerp leaves short titles untouched", () => {
  expect(truncateForSerp("Acme Widgets")).toBe("Acme Widgets");
});

test("truncateForSerp truncates a long title to 57 chars plus ellipsis", () => {
  const long = "A".repeat(80);
  const out = truncateForSerp(long);
  expect(out).toBe(`${"A".repeat(57)}…`);
  expect(out.length).toBe(58);
});

test("titleCountColor flags the 50-60 sweet spot as green", () => {
  expect(titleCountColor(55)).toBe("text-emerald-500");
  expect(titleCountColor(50)).toBe("text-emerald-500");
  expect(titleCountColor(60)).toBe("text-emerald-500");
});

test("titleCountColor flags near-miss lengths as amber", () => {
  expect(titleCountColor(45)).toBe("text-amber-500");
  expect(titleCountColor(65)).toBe("text-amber-500");
});

test("titleCountColor flags empty as neutral and far-off lengths as red", () => {
  expect(titleCountColor(0)).toBe("text-gray-600");
  expect(titleCountColor(10)).toBe("text-red-500");
  expect(titleCountColor(90)).toBe("text-red-500");
});

test("truncateDescriptionForSerp truncates a long description to 157 chars plus ellipsis", () => {
  const long = "A".repeat(200);
  const out = truncateDescriptionForSerp(long);
  expect(out).toBe(`${"A".repeat(157)}…`);
  expect(out.length).toBe(158);
});

test("descriptionCountColor flags the 150-160 sweet spot as green and edges as amber/red", () => {
  expect(descriptionCountColor(155)).toBe("text-emerald-500");
  expect(descriptionCountColor(130)).toBe("text-amber-500");
  expect(descriptionCountColor(170)).toBe("text-amber-500");
  expect(descriptionCountColor(0)).toBe("text-gray-600");
  expect(descriptionCountColor(50)).toBe("text-red-500");
});
