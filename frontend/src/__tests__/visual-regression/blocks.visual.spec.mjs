// Visual regression baselines for every library block template
// (frontend/src/lib/blocks.js + blocksExtra.js's merged CATEGORIES).
//
// Phase 6 of the Phase 4b block-CSS refactor: prior phases moved ~112/117
// block templates from inline style="..." to author-time CSS classes
// (blockClassName.js) with the CSS collected in blockStyles.generated.js and
// wired into the live canvas by Canvas.jsx. This suite exists so a future
// phase can delete stripInlineStyles.js's inline-style-extraction fallback
// path without flying blind — it screenshots every block, converted or not,
// so it stays valid regardless of a given block's conversion state.
//
// Rendering path: rather than driving the full app + drag-and-drop 117
// times (slow, flaky, and the app isn't running for this config), each test
// renders a block's raw `html` string into a bare page whose only styling is
// the exact same two global stylesheets Canvas.jsx injects into the live
// canvas — RESPONSIVE_CSS_BODY and BLOCK_STYLES_CSS, imported directly from
// their real source files, not hand-copied. The html is applied via
// `el.innerHTML = ...`, mirroring Canvas.jsx's dangerouslySetInnerHTML
// (notably: embedded <script> tags in a few zenero blocks stay inert here
// exactly like they do in the live canvas).
//
// Zenero live-data blocks (category "zenero", including the three
// "*-live" esports widgets): NOT skipped. Every one of these bakes a
// static empty-state fallback directly into block.html (e.g. "No roster
// yet", "Add stats in the Zenero dashboard"), and the embedded hydration
// <script> in the *-live blocks bails out immediately when
// data-forge-project-id is empty (no fetch fires) — so they render
// meaningfully with zero backend. The baseline captures that empty state.
//
// External network (images.unsplash.com for <img>/<video poster>,
// storage.googleapis.com for the sample <video> mp4) is stubbed so
// baselines are deterministic and don't depend on network access.
import { test, expect } from "@playwright/test";
import { CATEGORIES } from "../../lib/blocks.js";
import { BLOCK_STYLES_CSS } from "../../lib/blockStyles.generated.js";
import { RESPONSIVE_CSS_BODY } from "../../lib/responsiveCss.js";

// 1x1 PNG. Stands in for every unsplash image/video-poster URL so layout
// (which only cares about the box, not pixel content) stays deterministic.
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

// Matches Canvas.jsx's desktop viewport width (VIEWPORT_WIDTHS.desktop),
// its `containerType: inline-size` on the same wrapper element (so
// @container rules in BLOCK_STYLES_CSS/RESPONSIVE_CSS_BODY behave the same
// way they do in the real canvas), and its `min-h-[600px]` canvas-root —
// several nav/hero blocks are `position: absolute` overlays with zero
// intrinsic height (meant to sit over a hero behind them), and it's that
// 600px floor on the real canvas-root, not anything about the block itself,
// that keeps them from collapsing to an invisible 0x0 box.
const BASE_HTML = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;} #wd-root{width:1200px;min-height:600px;container-type:inline-size;background:#fff;}</style>
<style>${RESPONSIVE_CSS_BODY}
${BLOCK_STYLES_CSS}</style>
</head><body><div id="wd-root"></div></body></html>`;

test.beforeEach(async ({ page }) => {
  await page.route(/(images\.unsplash\.com|storage\.googleapis\.com)/, (route) => {
    const url = route.request().url();
    // The sample mp4 has no local stand-in worth shipping; aborting it just
    // leaves the <video> showing its poster frame, which IS stubbed below.
    if (url.includes("storage.googleapis.com")) return route.abort();
    return route.fulfill({ contentType: "image/png", body: PLACEHOLDER_PNG });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.setContent(BASE_HTML, { waitUntil: "load" });
});

for (const cat of CATEGORIES) {
  test.describe(cat.label, () => {
    for (const block of cat.blocks) {
      test(`${block.id} - ${block.label || block.id}`, async ({ page }) => {
        await page.evaluate((html) => {
          // Matches Canvas.jsx's per-element wrapper (`className="relative
          // group ..."` around each dangerouslySetInnerHTML) so absolutely
          // positioned block content resolves against the same containing
          // block it would in the live canvas.
          document.getElementById("wd-root").innerHTML =
            `<div style="position:relative">${html}</div>`;
        }, block.html);
        const root = page.locator("#wd-root");
        await expect(root).toHaveScreenshot([cat.id, `${block.id}.png`]);
      });
    }
  });
}
