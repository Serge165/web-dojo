/**
 * themeCompiler.js - Avalon GEMS theme system
 * Provides pre-compiled CSS for each gem theme.
 */

const SHARED_ANIMATIONS = [
  "@keyframes gem-pulse {",
  "  0%, 100% { filter: brightness(1); }",
  "  50% { filter: brightness(1.1); }",
  "}",
  "",
  "@keyframes shimmer {",
  "  0% { background-position: -200% 0; }",
  "  100% { background-position: 200% 0; }",
  "}",
  "",
  "@keyframes sparkle-sweep {",
  "  0% { left: -100%; }",
  "  100% { left: 100%; }",
  "}",
  "",
  "@keyframes bubble-pop {",
  "  0% { width: 0; height: 0; opacity: 1; }",
  "  100% { width: 40px; height: 40px; opacity: 0; }",
  "}",
].join("\n");

const GEM_CSS = {};
const _g = (name, lines) => { GEM_CSS[name] = lines.join("\n"); };

_g("ruby", [
  ".gem-ruby {",
  "  background: linear-gradient(135deg, #8b0000 0%, #dc143c 50%, #ff1744 100%);",
  "  animation: gem-pulse 3s ease-in-out infinite;",
  "}",
  ".gem-ruby .text-container {",
  "  background: rgba(255, 255, 255, 0.85); padding: 20px; border-radius: 8px;",
  "  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);",
  "}",
  ".gem-ruby h1, .gem-ruby h2, .gem-ruby h3 {",
  "  background: linear-gradient(90deg, #8b0000 0%, #ff1744 50%, #8b0000 100%);",
  "  background-size: 200% 100%;",
  "  -webkit-background-clip: text; -webkit-text-fill-color: transparent;",
  "  animation: shimmer 2s linear infinite;",
  "}",
  ".gem-ruby p { color: #333; }",
]);

_g("sapphire", [
  ".gem-sapphire {",
  "  background: linear-gradient(135deg, #191970 0%, #4169e1 50%, #1e90ff 100%);",
  "  animation: gem-pulse 3s ease-in-out infinite;",
  "}",
  ".gem-sapphire .text-container {",
  "  background: rgba(255, 255, 255, 0.85); padding: 20px; border-radius: 8px;",
  "  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);",
  "}",
  ".gem-sapphire h1, .gem-sapphire h2, .gem-sapphire h3 {",
  "  background: linear-gradient(90deg, #191970 0%, #1e90ff 50%, #191970 100%);",
  "  background-size: 200% 100%;",
  "  -webkit-background-clip: text; -webkit-text-fill-color: transparent;",
  "  animation: shimmer 2s linear infinite;",
  "}",
  ".gem-sapphire p { color: #333; }",
]);

_g("emerald", [
  ".gem-emerald {",
  "  background: linear-gradient(135deg, #004d00 0%, #00b300 50%, #33ff33 100%);",
  "  animation: gem-pulse 3s ease-in-out infinite;",
  "}",
  ".gem-emerald .text-container {",
  "  background: rgba(255, 255, 255, 0.85); padding: 20px; border-radius: 8px;",
  "  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);",
  "}",
  ".gem-emerald h1, .gem-emerald h2, .gem-emerald h3 {",
  "  background: linear-gradient(90deg, #004d00 0%, #33ff33 50%, #004d00 100%);",
  "  background-size: 200% 100%;",
  "  -webkit-background-clip: text; -webkit-text-fill-color: transparent;",
  "  animation: shimmer 2s linear infinite;",
  "}",
  ".gem-emerald p { color: #333; }",
]);

_g("diamond", [
  ".gem-diamond {",
  "  background: linear-gradient(135deg, #f0f8ff 0%, #e6f2ff 50%, #ccccff 100%);",
  "  animation: gem-pulse 3s ease-in-out infinite;",
  "}",
  ".gem-diamond .text-container {",
  "  background: rgba(255, 255, 255, 0.85); padding: 20px; border-radius: 8px;",
  "  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);",
  "}",
  ".gem-diamond h1, .gem-diamond h2, .gem-diamond h3 {",
  "  background: linear-gradient(90deg, #4169e1 0%, #87ceeb 50%, #4169e1 100%);",
  "  background-size: 200% 100%;",
  "  -webkit-background-clip: text; -webkit-text-fill-color: transparent;",
  "  animation: shimmer 2s linear infinite;",
  "}",
  ".gem-diamond p { color: #333; }",
]);

_g("amethyst", [
  ".gem-amethyst {",
  "  background: linear-gradient(135deg, #4b0082 0%, #9370db 50%, #dda0dd 100%);",
  "  animation: gem-pulse 3s ease-in-out infinite;",
  "}",
  ".gem-amethyst .text-container {",
  "  background: rgba(255, 255, 255, 0.85); padding: 20px; border-radius: 8px;",
  "  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);",
  "}",
  ".gem-amethyst h1, .gem-amethyst h2, .gem-amethyst h3 {",
  "  background: linear-gradient(90deg, #4b0082 0%, #dda0dd 50%, #4b0082 100%);",
  "  background-size: 200% 100%;",
  "  -webkit-background-clip: text; -webkit-text-fill-color: transparent;",
  "  animation: shimmer 2s linear infinite;",
  "}",
  ".gem-amethyst p { color: #333; }",
]);

_g("topaz", [
  ".gem-topaz {",
  "  background: linear-gradient(135deg, #b8860b 0%, #ffa500 50%, #ffb347 100%);",
  "  animation: gem-pulse 3s ease-in-out infinite;",
  "}",
  ".gem-topaz .text-container {",
  "  background: rgba(255, 255, 255, 0.85); padding: 20px; border-radius: 8px;",
  "  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);",
  "}",
  ".gem-topaz h1, .gem-topaz h2, .gem-topaz h3 {",
  "  background: linear-gradient(90deg, #b8860b 0%, #ffb347 50%, #b8860b 100%);",
  "  background-size: 200% 100%;",
  "  -webkit-background-clip: text; -webkit-text-fill-color: transparent;",
  "  animation: shimmer 2s linear infinite;",
  "}",
  ".gem-topaz p { color: #333; }",
]);
/** Available gem theme names */
export const GEM_THEMES = Object.keys(GEM_CSS);

/** 3-stop swatch per gem, for UI previews (matches each gem's background gradient). */
export const GEM_SWATCHES = {
  ruby: ["#8b0000", "#dc143c", "#ff1744"],
  sapphire: ["#191970", "#4169e1", "#1e90ff"],
  emerald: ["#004d00", "#00b300", "#33ff33"],
  diamond: ["#f0f8ff", "#e6f2ff", "#ccccff"],
  amethyst: ["#4b0082", "#9370db", "#dda0dd"],
  topaz: ["#b8860b", "#ffa500", "#ffb347"],
};

/**
 * Get compiled CSS for a specific gem, including shared animations.
 * @param {string} gem — gem name
 * @returns {string}
 */
export const getGemCss = (gem) => {
  if (!GEM_CSS[gem]) return "";
  return [SHARED_ANIMATIONS, GEM_CSS[gem]].join("\n");
};

/**
 * Get compiled CSS for all gems.
 * @returns {string}
 */
export const getAllGemCss = () => {
  return [SHARED_ANIMATIONS, ...GEM_THEMES.map((g) => GEM_CSS[g])].join("\n");
};

/**
 * Compiled gem CSS as a `<style data-forge-theme>` block, scoped to `body`
 * instead of a `.gem-{name}` class — this is what lets it plug straight into
 * the same head_html injection pipeline every other theme in themes.js uses
 * (Builder.jsx's applyTheme strips/replaces `data-forge-theme` blocks, and
 * extractForgeCss routes them into every export path automatically), with
 * no body-class plumbing needed anywhere.
 * @param {string} gem — gem name
 * @returns {string}
 */
export const gemThemeHeadHtml = (gem) => {
  if (!GEM_CSS[gem]) return "";
  const css = getGemCss(gem).replace(new RegExp(`\\.gem-${gem}\\b`, "g"), "body");
  return `<style data-forge-theme="gem-${gem}">\n${css}\n</style>`;
};

/**
 * Apply an Avalon GEMS theme to exported HTML.
 * Adds gem-{name} class to <body> and merges theme CSS.
 *
 * @param {string} html   — exported HTML string
 * @param {string} css    — exported CSS string
 * @param {string} gem    — gem name
 * @param {object} [opts] — opts.inline: inject CSS as <style> in head
 * @returns {{ html: string, css: string }}
 */
export const exportWithGemTheme = (html, css, gem, opts = {}) => {
  if (!GEM_CSS[gem]) return { html, css };

  const themeCss = getGemCss(gem);
  const themedHtml = html.replace(
    "<body",
    '<body class="gem-' + gem + '"'
  );

  if (opts.inline) {
    const styleTag = '<style>' + themeCss + '</style>\n';
    const idx = themedHtml.indexOf("</head>");
    if (idx !== -1) {
      return {
        html: themedHtml.slice(0, idx) + styleTag + themedHtml.slice(idx),
        css,
      };
    }
  }

  return { html: themedHtml, css: [themeCss, css].join("\n") };
};
