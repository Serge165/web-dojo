import { GEM_THEMES, GEM_SWATCHES, getGemCss, getAllGemCss, exportWithGemTheme, gemThemeHeadHtml } from "./themeCompiler";

describe("GEM_THEMES", () => {
  test("exports all 6 gem names", () => {
    expect(GEM_THEMES).toEqual(["ruby", "sapphire", "emerald", "diamond", "amethyst", "topaz"]);
    expect(GEM_THEMES).toHaveLength(6);
  });
});

describe("getGemCss", () => {
  test.each(["ruby", "sapphire", "emerald", "diamond", "amethyst", "topaz"])(
    "%s gem returns CSS with .gem-%s class and shared animations",
    (gem) => {
      const css = getGemCss(gem);
      expect(css).toContain(`.gem-${gem}`);
      expect(css).toContain("@keyframes gem-pulse");
      expect(css).toContain("@keyframes shimmer");
    }
  );

  test("returns empty string for unknown gem", () => {
    expect(getGemCss("nonexistent")).toBe("");
  });

  test("joins declaration lines with real newlines, not literal backslash-n", () => {
    // Regression: _g() used to join with the 2-char string "\\n" instead of
    // an actual newline, so the compiled CSS shipped with literal "\n" text.
    const css = getGemCss("ruby");
    expect(css).not.toMatch(/\\n/);
    expect(css.split("\n").length).toBeGreaterThan(5);
  });

  test("each gem includes its unique gradient colors", () => {
    const ruby = getGemCss("ruby");
    expect(ruby).toContain("#8b0000");
    expect(ruby).toContain("#ff1744");

    const sapphire = getGemCss("sapphire");
    expect(sapphire).toContain("#191970");
    expect(sapphire).toContain("#1e90ff");
  });
});

describe("getAllGemCss", () => {
  test("returns CSS for all 6 gems plus shared animations", () => {
    const css = getAllGemCss();
    // Should contain all gem classes
    GEM_THEMES.forEach((gem) => {
      expect(css).toContain(`.gem-${gem}`);
    });
    expect(css).toContain("@keyframes gem-pulse");
    expect(css).toContain("@keyframes shimmer");
    expect(css).toContain("@keyframes sparkle-sweep");
    expect(css).toContain("@keyframes bubble-pop");
  });
});

describe("exportWithGemTheme", () => {
  const sampleHtml = '<!doctype html><html><head><meta charset="utf-8" /><title>Test</title></head><body><h1>Hello</h1></body></html>';
  const sampleCss = "body { margin: 0; }";

  test("adds gem class to <body>", () => {
    const result = exportWithGemTheme(sampleHtml, sampleCss, "ruby");
    expect(result.html).toContain('<body class="gem-ruby"');
    expect(result.html).toContain("<h1>Hello</h1>");
  });

  test("merges theme CSS into the CSS string by default", () => {
    const result = exportWithGemTheme(sampleHtml, sampleCss, "ruby");
    expect(result.css).toContain(".gem-ruby");
    expect(result.css).toContain("@keyframes gem-pulse");
    expect(result.css).toContain("body { margin: 0; }");
  });

  test("injects theme CSS as <style> in head when opts.inline is true", () => {
    const result = exportWithGemTheme(sampleHtml, sampleCss, "emerald", { inline: true });
    expect(result.html).toContain("<style>");
    expect(result.html).toContain(".gem-emerald");
    expect(result.html).toContain("</style>");
    // Style tag should be inside <head>
    const headEnd = result.html.indexOf("</head>");
    const stylePos = result.html.indexOf("<style>");
    expect(stylePos).toBeLessThan(headEnd);
  });

  test("returns unchanged html/css for unknown gem", () => {
    const result = exportWithGemTheme(sampleHtml, sampleCss, "unknown");
    expect(result.html).toBe(sampleHtml);
    expect(result.css).toBe(sampleCss);
  });

  test("all 6 gems can be applied without error", () => {
    GEM_THEMES.forEach((gem) => {
      const result = exportWithGemTheme(sampleHtml, sampleCss, gem);
      expect(result.html).toContain(`class="gem-${gem}"`);
      expect(result.css).toContain(`.gem-${gem}`);
    });
  });
});

describe("GEM_SWATCHES", () => {
  test("every gem theme has a 3-color swatch", () => {
    GEM_THEMES.forEach((gem) => {
      expect(GEM_SWATCHES[gem]).toHaveLength(3);
      GEM_SWATCHES[gem].forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/));
    });
  });
});

describe("gemThemeHeadHtml", () => {
  test("wraps compiled CSS in a data-forge-theme style block scoped to body", () => {
    const head = gemThemeHeadHtml("ruby");
    expect(head).toMatch(/^<style data-forge-theme="gem-ruby">/);
    expect(head).toContain("</style>");
    // Selectors rewritten from .gem-ruby to body so the existing head_html
    // theme-injection pipeline (Builder.jsx applyTheme / extractForgeCss)
    // can apply it with no body-class plumbing.
    expect(head).toContain("body {");
    expect(head).toContain("body h1, body h2, body h3 {");
    expect(head).not.toContain(".gem-ruby");
    expect(head).toContain("@keyframes gem-pulse");
  });

  test("returns empty string for unknown gem", () => {
    expect(gemThemeHeadHtml("nonexistent")).toBe("");
  });
});