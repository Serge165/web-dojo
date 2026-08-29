// ===== Phase 6 Task 4: page elements -> PowerPoint-style nested outline =====
// Two stages, each independently testable:
//  1. buildOutlineFromPage walks each element's HTML (DOMParser) and emits a
//     flat stream of {tag, text, listItems} nodes — headings, paragraphs and
//     list containers. Structural wrappers (section, div, nav…) are descended
//     into, never emitted, so page chrome never pollutes the outline.
//     Browser-only (jsdom in tests); [] without a DOM.
//  2. nodesToOutline groups that stream: h1-h6 open {type:"heading"} entries
//     (level 1-6) and everything after nests under the most recent heading;
//     content before the first heading stays at the root (nothing silently
//     dropped). Other block tags become {type:"element"} entries labelled by
//     their tag; empty structural containers produce nothing.

const _textOf = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();

const _walk = (root, out) => {
  for (const el of Array.from(root ? root.children : [])) {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const text = _textOf(el);
      if (text) out.push({ tag, text, listItems: [] });
    } else if (tag === "p") {
      const text = _textOf(el);
      if (text) out.push({ tag, text, listItems: [] });
    } else if (tag === "ul" || tag === "ol") {
      const listItems = Array.from(el.querySelectorAll("li")).map(_textOf).filter(Boolean);
      if (listItems.length) out.push({ tag, text: "", listItems });
    } else {
      _walk(el, out); // wrapper: descend into it, never emit it
    }
  }
};

// Empty structural containers carry no outline information — skipped.
const _STRUCTURAL = new Set(["section", "header", "footer", "main", "article", "aside"]);

export const nodesToOutline = (nodes) => {
  const out = [];
  let current = null;
  for (const n of nodes || []) {
    if (!n || !n.tag) continue;
    const tag = String(n.tag).toLowerCase();
    const text = String(n.text || "").trim();
    const listItems = (Array.isArray(n.listItems) ? n.listItems : [])
      .map((t) => String(t || "").trim())
      .filter(Boolean);
    if (/^h[1-6]$/.test(tag)) {
      current = { type: "heading", level: Number(tag[1]), text: text || "(untitled)", children: [] };
      out.push(current);
    } else if (_STRUCTURAL.has(tag) && !text && listItems.length === 0) {
      continue;
    } else if (tag === "p") {
      if (!text) continue;
      const node = { type: "paragraph", text };
      if (current) current.children.push(node);
      else out.push(node);
    } else if (tag === "ul" || tag === "ol") {
      for (const item of listItems) {
        const node = { type: "bullet", text: item };
        if (current) current.children.push(node);
        else out.push(node);
      }
    } else {
      const node = { type: "element", tag, text };
      if (current) current.children.push(node);
      else out.push(node);
    }
  }
  return out;
};

export const buildOutlineFromPage = (elements) => {
  if (typeof document === "undefined") return [];
  const nodes = [];
  for (const el of elements || []) {
    const html = String((el && el.html) || "");
    if (!html.trim()) continue;
    _walk(new DOMParser().parseFromString(html, "text/html").body, nodes);
  }
  return nodesToOutline(nodes);
};
