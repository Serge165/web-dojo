#!/usr/bin/env node
// One-time, idempotent migration: adds a `block-heading` marker class to
// each block's first heading element (if any, and if the block isn't a
// nav/footer — every block gets an optional heading except those two, per
// the block spec), and `container block {blockType}` marker classes to
// each block's structured-content holder (gallery image grid / timeline
// list / bento tile grid), reusing the SAME content heuristics already
// proven against these 117 templates in BlockEditMenu.jsx's
// detectBlockKind. Purely additive — only adds class-attribute text to
// elements that already exist; never inserts new DOM nodes, never
// restructures nesting. See docs/superpowers/specs/
// 2026-08-30-block-editor-refactor-design.md §1.
//
// Blocks the heuristics can't confidently classify are left untouched and
// reported — mirrors phase4b-classify-blocks.mjs's own COLLISIONS report
// precedent rather than guessing.
//
// Run: node frontend/scripts/migrate-block-regions.mjs

// --- pure transforms (unit tested in migrate-block-regions.test.mjs) ---

const isNavOrFooter = (html) => /^\s*<nav\b/i.test(html) || /\bfooter\b/i.test((html.match(/^\s*<[a-z]+[^>]*class="([^"]*)"/i) || [])[1] || "");

export function markHeading(html) {
  if (!html || isNavOrFooter(html)) return { html, changed: false };
  const m = html.match(/<h1\b[^>]*class="([^"]*)"[^>]*>/i) || html.match(/<h2\b[^>]*class="([^"]*)"[^>]*>/i);
  if (!m) return { html, changed: false };
  if (/\bblock-heading\b/.test(m[1])) return { html, changed: false }; // idempotent
  const tag = m[0].toLowerCase().startsWith("<h1") ? "h1" : "h2";
  const re = new RegExp(`(<${tag}\\b[^>]*class=")([^"]*)("[^>]*>)`, "i");
  return { html: html.replace(re, (_m2, a, cls, c) => `${a}${cls} block-heading${c}`), changed: true };
}

// Finds the div whose direct children are 3+ <img> tags (gallery),
// returns null if not found — mirrors the existing gallery heuristic.
const findGalleryGridDiv = (html) => {
  const divs = html.match(/<div\b[^>]*class="[^"]*"[^>]*>/gi) || [];
  for (const openTag of divs) {
    const start = html.indexOf(openTag);
    const rest = html.slice(start + openTag.length);
    const closeIdx = rest.indexOf("</div>");
    if (closeIdx < 0) continue;
    const inner = rest.slice(0, closeIdx);
    const imgCount = (inner.match(/<img\b/gi) || []).length;
    if (imgCount >= 3 && !/<div\b/i.test(inner)) return openTag; // leaf div, 3+ images, no nested divs
  }
  return null;
};

export function markContentRegion(html, blockId) {
  if (!html) return { html, changed: false, reason: "empty html" };

  // Timeline: tag the <ol> itself.
  if (/<ol\b[^>]*class="([^"]*)"[^>]*>/i.test(html) && /<li[\s>]/i.test(html)) {
    if (/class="[^"]*\bcontainer block\b/i.test(html)) return { html, changed: false }; // idempotent
    const re = /(<ol\b[^>]*class=")([^"]*)("[^>]*>)/i;
    return {
      html: html.replace(re, (_m, a, cls, c) => `${a}${cls} container block ${blockId}${c}`),
      changed: true,
    };
  }

  // Gallery: tag the leaf div holding 3+ <img> tags.
  const galleryDiv = findGalleryGridDiv(html);
  if (galleryDiv) {
    if (/class="[^"]*\bcontainer block\b/i.test(html)) return { html, changed: false }; // idempotent
    const re = /(<div\b[^>]*class=")([^"]*)("[^>]*>)/i;
    const idx = html.indexOf(galleryDiv);
    const before = html.slice(0, idx);
    const rest = html.slice(idx);
    const patched = rest.replace(re, (_m, a, cls, c) => `${a}${cls} container block ${blockId}${c}`);
    return { html: before + patched, changed: true };
  }

  // Bento: tag the div whose direct children are 3+ divs each containing an <h3>.
  const bentoMatch = html.match(/<div\b[^>]*class="([^"]*)"[^>]*>((?:\s*<div\b[^>]*><h3[\s>][\s\S]*?<\/div>\s*){3,})<\/div>/i);
  if (bentoMatch) {
    if (/class="[^"]*\bcontainer block\b/i.test(html)) return { html, changed: false }; // idempotent
    const re = /(<div\b[^>]*class=")([^"]*)("[^>]*>)/i;
    const idx = html.indexOf(bentoMatch[0]);
    const before = html.slice(0, idx);
    const rest = html.slice(idx);
    const patched = rest.replace(re, (_m, a, cls, c) => `${a}${cls} container block ${blockId}${c}`);
    return { html: before + patched, changed: true };
  }

  return { html, changed: false, reason: `${blockId}: no gallery/timeline/bento content found` };
}

// Applies the migration to every block in `cats` against `source`, skipping
// any block object already in `processed` (mergeCategories in blocks.js
// aliases EXTRA_CATEGORIES's block objects into CATEGORIES by reference —
// without this guard a shared block gets "processed" against the wrong
// file's source and silently never written to the file it actually lives
// in). Exported for unit testing; used by main() below.
export function applyMigrationToSource(source, cats, processed) {
  const skipped = [];
  let headingCount = 0;
  let contentCount = 0;

  for (const cat of cats) {
    for (const block of cat.blocks) {
      if (processed.has(block)) continue;
      processed.add(block);

      const afterHeading = markHeading(block.html);
      if (afterHeading.changed) headingCount += 1;
      const afterContent = markContentRegion(afterHeading.html, block.id);
      if (afterContent.changed) contentCount += 1;
      else if (afterContent.reason && /no gallery\/timeline\/bento/.test(afterContent.reason)) {
        // Not every block has structured content (heroes, CTAs, cards) —
        // only report ones whose id LOOKS like it should (gallery/
        // timeline/bento/social in the id or label) but didn't match.
        if (/gallery|timeline|bento|social/i.test(block.id + block.label)) skipped.push(afterContent.reason);
      }
      const finalHtml = afterContent.html;
      if (finalHtml !== block.html) {
        // NOTE: replacer must be a function so `finalHtml` is inserted
        // verbatim — a string replacer would treat "$&"/"$1"/"$$" etc. in
        // finalHtml as $-patterns and corrupt any literal "$" it contains.
        source = source.replace(block.html, () => finalHtml);
        block.html = finalHtml; // keep in-memory copy consistent if reused below
      }
    }
  }

  return { source, headingCount, contentCount, skipped };
}

// --- CLI: patch blocks.js / blocksExtra.js in place ---------------------

async function main() {
  const { readFileSync, writeFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const path = await import("node:path");
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const LIB_DIR = path.join(__dirname, "..", "src", "lib");

  const { register } = await import("node:module");
  register("./phase4b-ext-loader.mjs", import.meta.url);
  const { CATEGORIES } = await import("../src/lib/blocks.js");
  const { EXTRA_CATEGORIES } = await import("../src/lib/blocksExtra.js");

  const skipped = [];
  let headingCount = 0;
  let contentCount = 0;
  const processed = new WeakSet();

  // EXTRA_CATEGORIES first: CATEGORIES = mergeCategories(CORE, EXTRA)
  // aliases EXTRA's block objects by reference, so they must be matched
  // against blocksExtra.js's own text before CATEGORIES's pass skips them.
  for (const [file, cats] of [
    [path.join(LIB_DIR, "blocksExtra.js"), EXTRA_CATEGORIES],
    [path.join(LIB_DIR, "blocks.js"), CATEGORIES],
  ]) {
    const source = readFileSync(file, "utf8");
    const result = applyMigrationToSource(source, cats, processed);
    writeFileSync(file, result.source);
    headingCount += result.headingCount;
    contentCount += result.contentCount;
    skipped.push(...result.skipped);
  }

  console.log(`Marked ${headingCount} headings, ${contentCount} content regions.`);
  if (skipped.length) {
    console.log(`\nSKIPPED (needs manual review):`);
    skipped.forEach((s) => console.log(`  - ${s}`));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
