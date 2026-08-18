import test from "node:test";
import assert from "node:assert/strict";
import { RESPONSIVE_CSS } from "../responsiveCss.js";

test("RESPONSIVE_CSS contains the 768px breakpoint", () => {
  assert.ok(RESPONSIVE_CSS.includes("@media (max-width: 768px)"));
});

test("RESPONSIVE_CSS forces inline grid-template-columns to 1fr", () => {
  assert.ok(RESPONSIVE_CSS.includes('[style*="grid-template-columns"]'));
  assert.ok(RESPONSIVE_CSS.includes("grid-template-columns: 1fr !important"));
});

test("RESPONSIVE_CSS provides the data-wd-stack opt-in for flex sections", () => {
  assert.ok(RESPONSIVE_CSS.includes("[data-wd-stack]"));
  assert.ok(RESPONSIVE_CSS.includes("flex-direction: column !important"));
});

test("RESPONSIVE_CSS is a complete, well-formed <style> block", () => {
  assert.ok(RESPONSIVE_CSS.trim().startsWith("<style>"));
  assert.ok(RESPONSIVE_CSS.trim().endsWith("</style>"));
});
