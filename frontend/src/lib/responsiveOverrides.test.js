import { buildResponsiveOverridesCss, upsertResponsiveOverridesCss } from "./responsiveOverrides";

const el = (id, responsive) => ({ id, html: "<div></div>", responsive });

test("buildResponsiveOverridesCss returns empty string when no element has overrides", () => {
  expect(buildResponsiveOverridesCss([el("a"), el("b", {})])).toBe("");
});

test("buildResponsiveOverridesCss emits a scoped !important rule per overridden property", () => {
  const out = buildResponsiveOverridesCss([el("a", { mobile: { padding: "8px" } })]);
  expect(out).toContain('@media (max-width: 767px)');
  expect(out).toContain('[data-forge-el-id="a"]{padding: 8px !important;}');
});

test("buildResponsiveOverridesCss orders tablet's @media block before mobile's", () => {
  const out = buildResponsiveOverridesCss([el("a", { tablet: { padding: "8px" }, mobile: { padding: "4px" } })]);
  expect(out.indexOf("max-width: 1024px")).toBeLessThan(out.indexOf("max-width: 767px"));
});

test("upsertResponsiveOverridesCss inserts the block into empty head_html", () => {
  const out = upsertResponsiveOverridesCss("", [el("a", { mobile: { display: "none" } })]);
  expect(out).toContain("data-forge-responsive-overrides");
  expect(out).toContain('[data-forge-el-id="a"]{display: none !important;}');
});

test("upsertResponsiveOverridesCss replaces a prior block in place, no duplicate", () => {
  const first = upsertResponsiveOverridesCss("<title>Hi</title>", [el("a", { mobile: { padding: "8px" } })]);
  const second = upsertResponsiveOverridesCss(first, [el("a", { mobile: { padding: "16px" } })]);
  expect(second.match(/data-forge-responsive-overrides/g)).toHaveLength(1);
  expect(second).toContain("padding: 16px !important");
  expect(second).not.toContain("padding: 8px !important");
  expect(second).toContain("<title>Hi</title>");
});

test("upsertResponsiveOverridesCss removes the whole block once no element has overrides left", () => {
  const withOverride = upsertResponsiveOverridesCss("<title>Hi</title>", [el("a", { mobile: { padding: "8px" } })]);
  const cleared = upsertResponsiveOverridesCss(withOverride, [el("a", {})]);
  expect(cleared).toBe("<title>Hi</title>");
});
