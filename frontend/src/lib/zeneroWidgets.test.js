import { hasZeneroWidget } from "./zeneroWidgets";

test("detects a Zenero-content block among elements", () => {
  const elements = [{ html: '<section data-forge-widget="updates">...</section>' }];
  expect(hasZeneroWidget(elements)).toBe(true);
});

test("detects the social-wall block too", () => {
  const elements = [{ html: '<section data-forge-widget="social-wall">...</section>' }];
  expect(hasZeneroWidget(elements)).toBe(true);
});

test("returns false when no element carries a Zenero/social-wall marker", () => {
  const elements = [{ html: "<section><h1>Hi</h1></section>" }, { html: '<div data-forge-widget="testimonials"></div>' }];
  expect(hasZeneroWidget(elements)).toBe(false);
});

test("handles an empty or missing elements array", () => {
  expect(hasZeneroWidget([])).toBe(false);
  expect(hasZeneroWidget(undefined)).toBe(false);
});
