// Client-side HTML importer. Parses a full HTML document and returns
// discovered top-level "sections" that can be dropped onto the canvas.

export const scanHtml = (raw) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "text/html");

  const headHtml = doc.head ? doc.head.innerHTML.trim() : "";

  const selectors = ["header", "nav", "section", "footer", "main > *", "article"];
  const seen = new Set();
  const found = [];

  selectors.forEach((sel) => {
    doc.body.querySelectorAll(sel).forEach((el) => {
      if (seen.has(el)) return;
      // avoid nested capture (only take top-most)
      let p = el.parentElement;
      let nested = false;
      while (p && p !== doc.body) {
        if (seen.has(p)) { nested = true; break; }
        p = p.parentElement;
      }
      if (nested) return;
      seen.add(el);
      found.push({
        id: `imported-${found.length}`,
        label: el.tagName.toLowerCase() + (el.id ? "#" + el.id : el.className ? "." + String(el.className).split(" ")[0] : ""),
        html: el.outerHTML,
      });
    });
  });

  // Fallback: if no sections found, treat body as one block
  if (found.length === 0 && doc.body && doc.body.innerHTML.trim()) {
    found.push({ id: "imported-body", label: "body", html: doc.body.innerHTML });
  }

  return { headHtml, sections: found };
};
