import { STANDARD_LAYOUT_SECTIONS, STANDARD_LAYOUT_CSS } from "./standardLayout";
import { scaffoldProjectFiles } from "./projectScaffold";

// Minimal project fixture the exporter accepts.
const project = {
  id: "p1",
  name: "Acme",
  pages: [{
    id: "home", name: "Home", slug: "index", status: "draft",
    seo: { title: "Acme Home", description: "Welcome" },
    elements: [{ id: "e1", html: "<p>hi</p>" }],
    head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "",
  }],
  template: { header_html: "", footer_html: "", use_template: false },
  analytics: {},
};

describe("STANDARD_LAYOUT_SECTIONS", () => {
  it("contains the full semantic skeleton with the expected classes", () => {
    for (const cls of [
      'class="site-header"',
      'class="site-nav"',
      'class="hero-section"',
      'class="site-main"',
      'class="content-section"',
      'class="container"',
      'class="site-footer"',
    ]) {
      expect(STANDARD_LAYOUT_SECTIONS).toContain(cls);
    }
  });

  it("is structurally valid: <main> nested sections come before <footer>, header/nav before main", () => {
    const order = [
      STANDARD_LAYOUT_SECTIONS.indexOf("site-header"),
      STANDARD_LAYOUT_SECTIONS.indexOf("site-nav"),
      STANDARD_LAYOUT_SECTIONS.indexOf("hero-section"),
      STANDARD_LAYOUT_SECTIONS.indexOf("site-main"),
      STANDARD_LAYOUT_SECTIONS.indexOf("site-footer"),
    ];
    order.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("includes placeholder comments so empty regions render visibly in code view only", () => {
    expect(STANDARD_LAYOUT_SECTIONS).toContain("<!-- Header blocks go here");
    expect(STANDARD_LAYOUT_SECTIONS).toContain("<!-- Footer blocks go here -->");
  });
});

describe("STANDARD_LAYOUT_CSS", () => {
  it("styles .container with a max-width var and responsive padding override", () => {
    expect(STANDARD_LAYOUT_CSS).toContain(".container {");
    expect(STANDARD_LAYOUT_CSS).toContain("max-width: var(--max-width, 1200px)");
    expect(STANDARD_LAYOUT_CSS).toContain("@media (max-width: 768px)");
    // The mobile breakpoint must shrink container padding from 40px to 16px.
    expect(STANDARD_LAYOUT_CSS).toContain("padding: 0 var(--pad-container-mobile, 16px)");
  });

  it("covers every class present in the skeleton HTML (no unstyled region)", () => {
    for (const cls of ["site-header", "site-nav", "hero-section", "site-main", "content-section", "container", "site-footer"]) {
      expect(STANDARD_LAYOUT_CSS).toMatch(new RegExp(`\\.${cls}\\s*{`));
    }
  });

  it("uses CSS variables with fallbacks for customization points", () => {
    expect(STANDARD_LAYOUT_CSS).toContain("var(--pad-section, 60px 0)");
    expect(STANDARD_LAYOUT_CSS).toContain("var(--pad-container, 40px)");
    expect(STANDARD_LAYOUT_CSS).toContain("var(--bg-footer, #f0f0f0)");
  });
});

describe("scaffoldProjectFiles integration", () => {
  it("seeding via the opt-in gate prepends the layout CSS above the theme vars section", () => {
    const globals = scaffoldProjectFiles(project, { standardLayout: true })
      .find((f) => f.path === "css/globals.css").content;
    const layoutAt = globals.indexOf("/* ===== Site Layout ===== */");
    const varsAt = globals.indexOf("/* ===== Theme Variables ===== */");
    expect(layoutAt).toBeGreaterThanOrEqual(0);
    expect(layoutAt).toBeLessThan(varsAt > -1 ? varsAt : globals.length);
  });

  it("does not inject anything by default (existing projects/templates unaffected)", () => {
    const globals = scaffoldProjectFiles(project)
      .find((f) => f.path === "css/globals.css").content;
    expect(globals).not.toContain("Site Layout");
  });
});
