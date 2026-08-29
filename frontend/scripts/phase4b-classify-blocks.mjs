#!/usr/bin/env node
// Phase 4b (Path A) — mechanical inline-style -> class conversion for every
// block template in blocks.js/blocksExtra.js.
//
// Run:  node frontend/scripts/phase4b-classify-blocks.mjs
// (run from the frontend/ dir, or any dir — paths below are resolved
// relative to this file)
//
// What it does, per block:
//   1. Stamp the block's root tag with data-wd-cat/data-wd-block, exactly
//      like variants.js::stampVariant does at insert time.
//   2. Run it through the REAL stripInlineStyles() (src/lib/stripInlineStyles.js)
//      — the same function export-time already uses — so every style="..."
//      becomes block-<catId>-<slug>-<occ> + the shared block-<catId>-<slug>
//      marker, byte-identical to what export produces today.
//   3. Strip the data-wd-cat/data-wd-block attributes back off (those are
//      only stamped at insert-time in the live app, not meant to live in
//      the static source templates).
//   4. Patch the block's `html:` field in its source file (blocks.js or
//      blocksExtra.js) in place, leaving everything else in the file
//      (categories, labels, ordering, comments, shared consts) untouched.
//   5. Collect the extracted CSS per category into blockStyles.generated.js.
//
// Blocks where an element already carries class="..." alongside style="..."
// are FLAGGED and SKIPPED (left with their original inline styles) rather
// than silently producing invalid double-class="..." markup — see the
// COLLISIONS report at the end of the run.
//
// Why blocks are read via real `import`, not by regex-scraping the source:
// blocks.js/blocksExtra.js build each block's `html` as a JS template
// literal with `${...}` interpolations (shared image-URL consts, .map().join()
// loops, ternaries). Importing the module gives the exact same fully-resolved
// HTML string the live app already uses (these arrays are built once at
// module load — there's no per-render re-evaluation), which is what
// export-time's stripInlineStyles operates on too. Regex-matching style="..."
// against the raw *source* text (pre-evaluation) breaks on interpolations
// like `style="text-align:${left?"right":"left"}"` — the embedded quotes
// from the ternary would terminate the match early. Using the resolved
// value sidesteps that entirely and guarantees byte-identical output.
//
// The source-file patch itself still operates on raw source text (a small
// hand-rolled JS-expression scanner below, `scanExpression`, finds exactly
// where each block's original `html: ...` value starts and ends — coping
// with nested backticks/${}/quotes/parens like the buildCommentsSectionHtml(...)
// call form) — only the *replacement* text is the resolved+classed string.
// Everything outside each block's html value (shared consts, category
// structure, comments) is left byte-identical.

import { register } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, "..");
const LIB_DIR = path.join(FRONTEND_ROOT, "src", "lib");
const BLOCKS_JS = path.join(LIB_DIR, "blocks.js");
const BLOCKS_EXTRA_JS = path.join(LIB_DIR, "blocksExtra.js");
const OUT_FILE = path.join(LIB_DIR, "blockStyles.generated.js");

register("./phase4b-ext-loader.mjs", import.meta.url);

const { CATEGORIES } = await import("../src/lib/blocks.js");
const { EXTRA_CATEGORIES } = await import("../src/lib/blocksExtra.js");
const { stripInlineStyles } = await import("../src/lib/stripInlineStyles.js");
const { blockClassName } = await import("../src/lib/blockClassName.js");
const { stampVariant } = await import("../src/lib/variants.js");

// ---------------------------------------------------------------------
// Which source file each block object came from. mergeCategories() in
// blocks.js copies arrays (`[...c.blocks]` / `.push(...c.blocks)`) but not
// the block objects themselves, so identity comparison against
// EXTRA_CATEGORIES's own block objects reliably tells us "this block came
// from blocksExtra.js" vs "blocks.js" (the only other source).
const extraBlockRefs = new Set();
for (const cat of EXTRA_CATEGORIES) for (const b of cat.blocks) extraBlockRefs.add(b);

const allBlocks = []; // { catId, catLabel, blockId, label, html, file }
for (const cat of CATEGORIES) {
  for (const b of cat.blocks) {
    allBlocks.push({
      catId: cat.id,
      catLabel: cat.label,
      blockId: b.id,
      label: b.label,
      html: b.html,
      file: extraBlockRefs.has(b) ? BLOCKS_EXTRA_JS : BLOCKS_JS,
    });
  }
}

// ---------------------------------------------------------------------
// Double-class collision detector: any opening tag in the block's HTML
// that carries both class="..." and style="..." would end up with two
// class="..." attributes after extraction (stripInlineStyles only ever
// replaces style="..." with one class="..."; it doesn't merge with an
// existing class attribute on the same tag). Flag, don't fix.
const hasDoubleClassCollision = (html) => {
  const tags = html.match(/<[a-zA-Z][^<>]*>/g) || [];
  return tags.some((t) => /\sclass="/.test(t) && /\sstyle="/.test(t));
};

// ---------------------------------------------------------------------
// Minimal JS-expression scanner used only to find the exact source span
// of each block's `html: <expr>` value in the original file text, so we
// can splice in the replacement without disturbing anything else. Treats
// backtick/quoted strings as opaque (correctly skipping nested ${...},
// nested backticks, and parens/braces inside them) and stops at the first
// top-level comma or closing bracket.
const scanQuoted = (str, start) => {
  const q = str[start];
  let i = start + 1;
  while (i < str.length) {
    if (str[i] === "\\") { i += 2; continue; }
    if (str[i] === q) return i;
    i++;
  }
  throw new Error("unterminated string literal at " + start);
};

const scanTemplateLiteral = (str, start) => {
  let i = start + 1;
  while (i < str.length) {
    const c = str[i];
    if (c === "\\") { i += 2; continue; }
    if (c === "`") return i;
    if (c === "$" && str[i + 1] === "{") {
      i += 2;
      let depth = 1;
      while (depth > 0 && i < str.length) {
        const cc = str[i];
        if (cc === "\\") { i += 2; continue; }
        if (cc === "`") { i = scanTemplateLiteral(str, i) + 1; continue; }
        if (cc === '"' || cc === "'") { i = scanQuoted(str, i) + 1; continue; }
        if (cc === "{") depth++;
        else if (cc === "}") depth--;
        i++;
      }
      continue;
    }
    i++;
  }
  throw new Error("unterminated template literal at " + start);
};

// Returns the exclusive end index of the expression starting at `start`
// (stops at a top-level `,` or a closing bracket that isn't ours).
const scanExpression = (str, start) => {
  let i = start;
  let depth = 0;
  while (i < str.length) {
    const c = str[i];
    if (c === "`") { i = scanTemplateLiteral(str, i) + 1; continue; }
    if (c === '"' || c === "'") { i = scanQuoted(str, i) + 1; continue; }
    if (c === "(" || c === "{" || c === "[") { depth++; i++; continue; }
    if (c === ")" || c === "}" || c === "]") {
      if (depth === 0) return i;
      depth--; i++; continue;
    }
    if (c === "," && depth === 0) return i;
    i++;
  }
  throw new Error("unterminated expression at " + start);
};

const escapeForTemplateLiteral = (s) =>
  s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

// ---------------------------------------------------------------------
// Process every block.
const patchesByFile = new Map([[BLOCKS_JS, []], [BLOCKS_EXTRA_JS, []]]);
const sourceText = new Map([
  [BLOCKS_JS, readFileSync(BLOCKS_JS, "utf8")],
  [BLOCKS_EXTRA_JS, readFileSync(BLOCKS_EXTRA_JS, "utf8")],
]);

const collisions = []; // { catId, blockId, tags: [...] }
const cssByCat = new Map(); // catId -> { label, component: [css...], media: [css...] }
let convertedCount = 0;
let skippedNoStyle = 0;

for (const block of allBlocks) {
  const { catId, catLabel, blockId, label, html, file } = block;

  if (!cssByCat.has(catId)) cssByCat.set(catId, { label: catLabel, component: [], media: [] });

  if (!html.includes("style=\"")) {
    // Nothing to extract (e.g. the pre-existing class-based `oxygene`
    // blocks). Leave the source untouched.
    skippedNoStyle++;
    continue;
  }

  const tags = html.match(/<[a-zA-Z][^<>]*>/g) || [];
  const collidingTags = tags.filter((t) => /\sclass="/.test(t) && /\sstyle="/.test(t));
  if (collidingTags.length > 0) {
    collisions.push({ catId, blockId, label, tags: collidingTags });
    continue; // flagged, not fixed, not converted — inline styles left as-is
  }

  const stamped = stampVariant(html, catId, blockId);
  const { html: classedArr, componentCss, mediaCss } = stripInlineStyles([{ id: blockId, html: stamped }]);
  const classed = classedArr
    .replace(/\s+data-wd-cat="[^"]*"/, "")
    .replace(/\s+data-wd-block="[^"]*"/, "");

  const bucket = cssByCat.get(catId);
  if (componentCss) bucket.component.push(`/* ${blockId} */\n${componentCss}`);
  if (mediaCss) bucket.media.push(mediaCss);

  // Locate & patch the original `html: <expr>` span in the source file.
  const text = sourceText.get(file);
  const idAnchor = `id: "${blockId}"`;
  const idPos = text.indexOf(idAnchor);
  if (idPos === -1) throw new Error(`could not locate id anchor for block ${blockId} in ${file}`);
  const htmlKeyPos = text.indexOf("html:", idPos);
  if (htmlKeyPos === -1) throw new Error(`could not locate html: field for block ${blockId} in ${file}`);
  let exprStart = htmlKeyPos + "html:".length;
  while (/\s/.test(text[exprStart])) exprStart++;
  const exprEnd = scanExpression(text, exprStart);
  // scanExpression's end index sits at the next top-level `,`/closing
  // bracket, which swallows any whitespace between the original
  // expression and that delimiter (e.g. `` `...` }`` -> lost the space
  // before `}` on single-line block entries). Preserve it by trimming
  // trailing whitespace off the replaced span and re-appending it after
  // the new literal instead of letting it get replaced away.
  let trimmedEnd = exprEnd;
  while (trimmedEnd > exprStart && /\s/.test(text[trimmedEnd - 1])) trimmedEnd--;
  const trailingWhitespace = text.slice(trimmedEnd, exprEnd);

  const replacement = "`" + escapeForTemplateLiteral(classed) + "`" + trailingWhitespace;
  patchesByFile.get(file).push({ start: exprStart, end: exprEnd, replacement, blockId });
  convertedCount++;
}

// ---------------------------------------------------------------------
// Apply patches (in file-position order) and write files back.
for (const [file, patches] of patchesByFile) {
  if (patches.length === 0) continue;
  patches.sort((a, b) => a.start - b.start);
  const text = sourceText.get(file);
  let out = "";
  let cursor = 0;
  for (const p of patches) {
    if (p.start < cursor) throw new Error(`overlapping patch for ${p.blockId} in ${file}`);
    out += text.slice(cursor, p.start) + p.replacement;
    cursor = p.end;
  }
  out += text.slice(cursor);
  writeFileSync(file, out, "utf8");
}

// ---------------------------------------------------------------------
// Emit the generated stylesheet module.
const catEntries = Array.from(cssByCat.entries()); // preserves first-seen (CATEGORIES) order
const byCategoryLines = catEntries.map(([catId, { component }]) => {
  const css = component.join("\n\n");
  return `  ${JSON.stringify(catId)}: ${css ? "`" + escapeForTemplateLiteral(css) + "`" : '""'},`;
});
const allMediaCss = catEntries.flatMap(([, { media }]) => media).join("\n");

const generated = `// AUTO-GENERATED by frontend/scripts/phase4b-classify-blocks.mjs — DO NOT EDIT BY HAND.
// Regenerate: \`node frontend/scripts/phase4b-classify-blocks.mjs\`
//
// Phase 4b (Path A): every block template's former inline style="..."
// attributes, extracted into CSS classes at author time (see
// stripInlineStyles.js / blockClassName.js for the naming scheme:
// block-<catId>-<slug>). Grouped per library category (blocks.js +
// blocksExtra.js's CATEGORIES), matching the "Blocks: <Label>" sections
// exportHtml.js's buildOrganizedStylesheet already emits at export time.
//
// NOT wired into the canvas or the exporter yet — that's a later phase.
// This module is just the extracted CSS payload.

export const BLOCK_STYLES_BY_CATEGORY = {
${byCategoryLines.join("\n")}
};

// Responsive (grid-template-columns) overrides collected across every
// category's blocks, same tier breakpoints stripInlineStyles.js uses
// (max-width: 1024px / 767px). Kept separate from the per-category buckets
// above, mirroring exportHtml.js's own "Media Queries" section.
export const BLOCK_STYLES_MEDIA_CSS = ${allMediaCss ? "`" + escapeForTemplateLiteral(allMediaCss) + "`" : '""'};

export const BLOCK_STYLES_CSS = [
  ...Object.values(BLOCK_STYLES_BY_CATEGORY),
  BLOCK_STYLES_MEDIA_CSS,
].filter(Boolean).join("\\n\\n");
`;

writeFileSync(OUT_FILE, generated, "utf8");

// ---------------------------------------------------------------------
// Report.
console.log(`Total blocks scanned: ${allBlocks.length}`);
console.log(`Converted: ${convertedCount}`);
console.log(`Skipped (no style= to extract, e.g. oxygene): ${skippedNoStyle}`);
console.log(`Flagged double-class collisions (skipped, left inline): ${collisions.length}`);
for (const c of collisions) {
  console.log(`  - [${c.catId}] ${c.blockId} (${c.label}):`);
  for (const t of c.tags) console.log(`      ${t}`);
}
console.log(`Wrote: ${path.relative(FRONTEND_ROOT, OUT_FILE)}`);
