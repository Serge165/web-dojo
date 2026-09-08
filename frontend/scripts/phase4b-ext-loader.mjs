// Tiny Node ESM resolve hook, used only by phase4b-classify-blocks.mjs so it
// can `import` blocks.js/blocksExtra.js directly under plain Node. Those
// files use extensionless relative specifiers (`from "./blocksExtra"`),
// which webpack/babel/Jest resolve fine but Node's native ESM resolver
// rejects. Rather than edit product source to add extensions (out of scope
// for this phase), this hook retries a failed relative resolution with a
// few extensions appended. Registered via `module.register()` in the
// classify script — not used anywhere else.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const EXTS = [".js", ".mjs", ".jsx"];

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith(".") && context.parentURL) {
      for (const ext of EXTS) {
        const candidateUrl = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidateUrl))) {
          return nextResolve(specifier + ext, context);
        }
      }
    }
    throw err;
  }
}
