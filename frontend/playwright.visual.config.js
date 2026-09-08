// Playwright config for the block-library visual regression suite (Phase 6
// of the Phase 4b block-CSS refactor). Separate from playwright.config.js
// because this suite doesn't need the app server: it renders block HTML
// straight into a page via page.setContent, injecting the same two global
// stylesheets Canvas.jsx injects (RESPONSIVE_CSS_BODY + BLOCK_STYLES_CSS),
// so it's fast and has nothing to do with the dashboard/funnel/social e2e
// flows in ./e2e. See src/__tests__/visual-regression/blocks.visual.spec.mjs.
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./src/__tests__/visual-regression",
  timeout: 15000,
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  // Baselines are recorded on Chromium only — cross-browser rendering drift
  // isn't what this suite is for, and 117 blocks x 3 browsers isn't worth
  // the runtime. Add projects here if that ever changes.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
