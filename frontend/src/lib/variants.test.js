import { stampVariant, readVariant } from "./variants";

test("stampVariant adds data-wd-cat/data-wd-block to the root tag", () => {
  const out = stampVariant("<nav>Hi</nav>", "navbars", "nav-simple");
  expect(out).toBe('<nav data-wd-cat="navbars" data-wd-block="nav-simple">Hi</nav>');
});

test("stampVariant preserves existing attributes on the root tag", () => {
  const out = stampVariant('<section style="padding:8px">Hi</section>', "hero", "hero-centered");
  expect(out).toContain('style="padding:8px"');
  expect(out).toContain('data-wd-cat="hero"');
  expect(out).toContain('data-wd-block="hero-centered"');
});

test("stampVariant is a no-op when there's no matching root tag", () => {
  expect(stampVariant("not html", "hero", "hero-centered")).toBe("not html");
});

test("readVariant reads back a stamped element's category and block id", () => {
  const stamped = stampVariant("<nav>Hi</nav>", "navbars", "nav-simple");
  expect(readVariant(stamped)).toEqual({ catId: "navbars", blockId: "nav-simple" });
});

test("readVariant returns null for unstamped html", () => {
  expect(readVariant("<nav>Hi</nav>")).toBeNull();
  expect(readVariant("")).toBeNull();
  expect(readVariant(null)).toBeNull();
});
