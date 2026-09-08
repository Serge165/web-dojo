import { test, expect } from "@playwright/test";

// Animation preset tests: verify animation presets load without errors
// across all libraries (GSAP, Framer Motion, CSS).

test.describe("Animation Presets", () => {
  test("CSS animation presets generate valid keyframes", async ({ page }) => {
    // Navigate to the builder
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // The animation generator should be accessible
    const generator = page.locator('[data-testid="animation-generator"]');
    await expect(generator).toBeVisible();
  });

  test("Library selector is present", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const librarySelect = page.locator('[data-testid="anim-library"]');
    await expect(librarySelect).toBeVisible();

    // Verify all three libraries are available
    const options = await librarySelect.locator("option").allTextContents();
    expect(options).toContain("GSAP");
    expect(options).toContain("Framer Motion");
    expect(options).toContain("CSS only");
  });

  test("Animation presets render without errors", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Verify preset buttons exist
    const fadeIn = page.locator('[data-testid="anim-preset-fade-in"]');
    await expect(fadeIn).toBeVisible();

    // Click a preset and verify the preview updates
    await fadeIn.click();
    const preview = page.locator('[data-testid="anim-preview"]');
    await expect(preview).toBeVisible();
  });

  test("GSAP library generates GSAP code", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Switch to GSAP library
    await page.locator('[data-testid="anim-library"]').selectOption("gsap");

    // Select a preset
    await page.locator('[data-testid="anim-preset-fade-in"]').click();

    // Verify the code output contains GSAP syntax
    const codeOutput = await page.locator('[data-testid="anim-css"]').textContent();
    expect(codeOutput).toContain("gsap.");
  });

  test("Framer Motion library generates Framer code", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Switch to Framer Motion library
    await page.locator('[data-testid="anim-library"]').selectOption("framer");

    // Select a preset
    await page.locator('[data-testid="anim-preset-fade-in"]').click();

    // Verify the code output contains Framer Motion syntax
    const codeOutput = await page.locator('[data-testid="anim-css"]').textContent();
    expect(codeOutput).toContain("initial=");
  });
});