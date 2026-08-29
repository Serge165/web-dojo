import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Generates blocks-data.json used by visual regression tests.
//
// blocks.js / blocksExtra.js are browser-side ESM sources. Rather than parsing
// their source text (fragile with nested template literals) we evaluate them
// directly:
//   - strips `export ` prefixes so declarations become local,
//   - injects cross-module deps into a wrapper-function scope,
//   - returns the exported values.
// Both modules are pure data/string builders with no DOM/window access, so a
// bare sandboxed scope is sufficient.

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIB = join(__dirname, "../../lib");

const blocksSrc = readFileSync(join(LIB, "blocks.js"), "utf8");
const blocksExtraSrc = readFileSync(join(LIB, "blocksExtra.js"), "utf8");

// Evaluate blocksExtra.js first: no imports, single named export.
const extraExports = (() => {
  const stripped = blocksExtraSrc.replace(/^export\s+/gm, "");
  return new Function(`\n${stripped}\nreturn { EXTRA_CATEGORIES };`)();
})();

// Evaluate blocks.js with EXTRA_CATEGORIES injected in place of its import.
const blocksExports = (() => {
  const stripped = blocksSrc
    // drop the single-line named import of EXTRA_CATEGORIES
    .replace(/^import\s*\{[^}]*\}\s*from\s*["'][^"']*["'];?\s*$/gm, "")
    .replace(/^export\s+/gm, "");
  const code = `\n${stripped}\nreturn { CATEGORIES, cardTemplate, WEB_SAFE_FONTS };`;
  const { EXTRA_CATEGORIES } = extraExports;
  return new Function("EXTRA_CATEGORIES", code)(EXTRA_CATEGORIES);
})();

const categories = blocksExports.CATEGORIES;
if (!Array.isArray(categories)) throw new Error("CATEGORIES did not evaluate to an array");

// Flatten categories into a per-block list for snapshot tests.
const blocks = [];
const categorySummaries = [];

for (const cat of categories) {
  if (!cat || !Array.isArray(cat.blocks)) continue;
  categorySummaries.push({ id: cat.id, label: cat.label, blockCount: cat.blocks.length });
  for (const block of cat.blocks) {
    if (!block || typeof block.html !== "string") continue;
    blocks.push({
      id: block.id,
      label: block.label,
      categoryId: cat.id,
      categoryLabel: cat.label,
      html: block.html,
    });
  }
}

const data = {
  generatedAt: new Date().toISOString(),
  totalCategories: categorySummaries.length,
  totalBlocks: blocks.length,
  categories: categorySummaries,
  blocks,
};

const OUT = join(__dirname, "blocks-data.json");
writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Generated ${OUT}: ${data.totalBlocks} blocks across ${data.totalCategories} categories.`);

