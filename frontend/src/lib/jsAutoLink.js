// JS auto-linking (Phase 4a, Task 5): keeps a page's HTML in sync with the
// files under js/ in the FileTree. Creating js/modal.js inserts
// <script src="js/modal.js"></script> before </body>; renaming updates the
// path; deleting removes the tag — so the author never hand-edits HTML.
// All helpers are idempotent and safe to call repeatedly.

const scriptTagFor = (name) => `<script src="js/${name}"></script>`;
// Matches an existing auto-link (or hand-written equivalent) for one file.
// Tolerates attribute order/spacing, self-closing slash and quotes.
const scriptTagRe = (name) =>
  new RegExp(`[ \\t]*<script[^>]*src=["']js/${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>\\s*</script>[ \\t]*\\n?`, "i");

// Insert <script src="js/<name>"></script> before </body> (or append to the
// document when there is no closing body tag). Idempotent: skips names that
// are already referenced anywhere in the HTML.
export const linkJsInHtml = (html, names) => {
  let out = String(html || "");
  for (const raw of Array.isArray(names) ? names : [names]) {
    if (!raw) continue;
    const name = String(raw).replace(/^\/?js\//, "").replace(/^\.\//, "");
    if (!name || !name.endsWith(".js")) continue;
    // Already linked anywhere (head_html or body)? Skip.
    if (out.includes(`js/${name}`)) continue;
    const tag = scriptTagFor(name);
    const bodyClose = out.match(/<\/body\s*>/i);
    if (bodyClose) {
      out = out.slice(0, bodyClose.index) + "  " + tag + "\n" + out.slice(bodyClose.index);
    } else {
      out = out.replace(/\s*$/, (m) => "\n" + tag + m);
    }
  }
  return out;
};

// Remove the matching <script src="js/<name>"></script> tag(s). Safe on
// documents that never linked the name.
export const unlinkJsInHtml = (html, names) => {
  let out = String(html || "");
  for (const raw of Array.isArray(names) ? names : [names]) {
    if (!raw) continue;
    const name = String(raw).replace(/^\/?js\//, "").replace(/^\.\//, "");
    if (!name) continue;
    out = out.replace(scriptTagRe(name), "");
  }
  return out;
};

// Rename helper: strip the old tag, then insert a fresh one pointing at the
// new filename (keeps it anchored at the end of the document).
export const relinkJsInHtml = (html, oldName, newName) => {
  const stripped = unlinkJsInHtml(html, [oldName]);
  return linkJsInHtml(stripped, [newName]);
};

// Which FileTree paths should trigger syncing: only real .js files under js/.
export const isJsFilePath = (path) =>
  typeof path === "string" && /^js\/[^/]+\.js$/.test(path);

export const fileNameOf = (path) => (isJsFilePath(path) ? path.slice(3) : null);
