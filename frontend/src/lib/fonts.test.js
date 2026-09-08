import {
  getFontFormat,
  fontFamilySlug,
  buildFontFace,
  buildFontVar,
  buildFontsStyleContent,
  buildFontsStyleBlock,
  fontFamilyFromFilename,
} from "./fonts";

test("getFontFormat maps file extensions", () => {
  expect(getFontFormat("Arial.ttf")).toBe("truetype");
  expect(getFontFormat("Arial-Bold.otf")).toBe("opentype");
  expect(getFontFormat("font.woff")).toBe("woff");
  expect(getFontFormat("font.woff2")).toBe("woff2");
  expect(getFontFormat("font.xml")).toBe("truetype"); // default fallback
});

test("getFontFormat maps data-URI MIME subtypes", () => {
  expect(getFontFormat("data:font/ttf;base64,AAAA")).toBe("truetype");
  expect(getFontFormat("data:font/woff2;base64,AAAA")).toBe("woff2");
  expect(getFontFormat("data:font/otf;base64,AAAA")).toBe("opentype");
});

test("fontFamilySlug lowercases and dashes spaces/symbols", () => {
  expect(fontFamilySlug("My Weird Font")).toBe("my-weird-font");
  expect(fontFamilySlug("Bangers!")).toBe("bangers");
  expect(fontFamilySlug("")).toBe("font"); // fallback
});

test("buildFontFace builds an @font-face rule with the data-URI src and matching format", () => {
  const face = buildFontFace({ family: "Pixelfont", file: "data:font/ttf;base64,AAAA" });
  expect(face).toContain("font-family: 'Pixelfont';");
  expect(face).toContain("src: url('data:font/ttf;base64,AAAA') format('truetype');");
  expect(face).toContain("font-weight: 400;");
  expect(face).toContain("font-style: normal;");
});

test("buildFontFace honors weight/style and a path src", () => {
  const face = buildFontFace({ family: "Bold", file: "fonts/Bold.otf", weight: 700, style: "italic" });
  expect(face).toContain("src: url('fonts/Bold.otf') format('opentype');");
  expect(face).toContain("font-weight: 700;");
  expect(face).toContain("font-style: italic;");
});

test("buildFontVar exposes a --font-<slug> CSS variable", () => {
  expect(buildFontVar("My Weird Font")).toBe("  --font-my-weird-font: 'My Weird Font', sans-serif;");
});

test("buildFontsStyleContent emits @font-face + a :root var block, extractable by the exporter", () => {
  const content = buildFontsStyleContent([{ family: "Pixelfont", file: "data:font/ttf;base64,AAAA" }]);
  expect(content).toContain("@font-face {");
  expect(content).toContain(":root {");
  expect(content).toContain("--font-pixelfont: 'Pixelfont', sans-serif;");
});

test("buildFontsStyleBlock wraps content in the data-forge-fonts marker", () => {
  const block = buildFontsStyleBlock([{ family: "Pixelfont", file: "data:font/ttf;base64,AAAA" }]);
  expect(block).toMatch(/<style data-forge-fonts>[\s\S]*<\/style>/);
});

test("fontFamilyFromFilename strips the font extension", () => {
  expect(fontFamilyFromFilename("Inter-Bold.ttf")).toBe("Inter-Bold");
  expect(fontFamilyFromFilename("Garamond.otf")).toBe("Garamond");
});