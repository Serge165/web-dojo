#!/usr/bin/env node
// Idempotent post-processor: wraps every background-image url(...) term in
// var(--block-bg-image, ...) inside the already-generated block CSS text.
//
// Unlike phase4b-classify-blocks.mjs (a one-shot tool that extracts CSS
// from live inline styles that no longer exist in blocks.js/blocksExtra.js
// — running it again wipes the generated CSS to empty), this script
// transforms the CSS TEXT already sitting in blockStyles.generated.js /
// block_styles_generated.py directly, so it's safe to re-run.
//
// Scope: wraps the first (and in every current template, only) url() term
// found in each background-image declaration. A future template with
// MULTIPLE url() layers in one background-image would need a numbered
// variable per layer — not needed today, revisit if that appears.
//
// Run: node frontend/scripts/wrap-block-bg-vars.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export function wrapBackgroundImageVars(cssText) {
  return cssText.replace(/background-image:([^;}]*)/g, (full, value) => {
    if (value.includes("var(--block-bg-image")) return full; // already wrapped
    const wrapped = value.replace(/url\(([^)]*)\)/g, (_m, inner) => `var(--block-bg-image, url(${inner}))`);
    return `background-image:${wrapped}`;
  });
}

function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const FRONTEND_ROOT = path.resolve(__dirname, "..");
  const files = [
    path.join(FRONTEND_ROOT, "src", "lib", "blockStyles.generated.js"),
    path.resolve(FRONTEND_ROOT, "..", "backend", "block_styles_generated.py"),
  ];
  for (const file of files) {
    const before = readFileSync(file, "utf8");
    const after = wrapBackgroundImageVars(before);
    if (after !== before) {
      writeFileSync(file, after);
      console.log(`wrapped background-image url() terms in ${file}`);
    } else {
      console.log(`no change needed in ${file}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
