import { saveAs } from "file-saver";

// Outline editor model + the Phase 6 helpers that derive PowerPoint-style
// nested outlines from page markup. Two node vocabularies, deliberately
// separate: "slide outline" entries {level, text, children:[{type,text}]}
// (buildOutlineFromPageHtml, a slide's .outline — rendered by OutlineTree)
// and "element outline" nodes {type:"heading"|..., level, text, children}
// (outlineFromHtml — serialised back by outlineToMarkdown).

const uid = () => "slide_" + Math.random().toString(36).slice(2, 10);

// ===== Markdown <-> slides =====

// Markdown outline -> slides. Each top-level heading (# Title) starts a new
// slide; everything until the next H1 becomes that slide's body, verbatim.
// Each slide also carries `outline` — the nested view of its body (H2-H6
// entries with bullets underneath; prose is copy, not structure).
export const parseOutlineMarkdown = (text) => {
  const lines = String(text || "").split(/\r?\n/);
  const slides = [];
  let current = null;
  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/);
    if (h1) {
      current = { id: uid(), title: h1[1].trim(), body: "" };
      slides.push(current);
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  return slides.map((s) => {
    const body = s.body.trim();
    return { id: s.id, title: s.title, body, outline: outlineFromMarkdownBody(body) };
  });
};

// A slide's markdown body -> nested outline entries (the OutlineTree shape).
// H2-H6 open an entry (level = hash count — H1 is the slide title's);
// "-"/"*"/"+" and ordered-list bullets nest under the most recent entry.
// Prose lines are skipped — the tree shows structure, not copy. Pure.
const outlineFromMarkdownBody = (body) => {
  const out = [];
  for (const line of String(body || "").split(/\r?\n/)) {
    let m;
    if ((m = line.match(/^(#{2,6})\s+(.+)/))) {
      out.push({ level: m[1].length, text: m[2].trim(), children: [] });
    } else if ((m = line.match(/^\s*[-*+]\s+(.+)/)) || (m = line.match(/^\s*\d+[.)]\s+(.+)/))) {
      if (out.length) out[out.length - 1].children.push({ type: "bullet", text: m[1].trim() });
    }
  }
  return out;
};

// ===== JSON import/export =====

export const exportOutlineJson = (slides, name = "outline") => {
  const blob = new Blob([JSON.stringify(slides, null, 2)], { type: "application/json;charset=utf-8" });
  saveAs(blob, `${name.replace(/\s+/g, "-").toLowerCase()}.json`);
};

// Throws on malformed input — caller shows the message as a toast. A page-
// derived slide's `outline` tree survives the round-trip.
export const importOutlineJson = (text) => {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Expected a JSON array of slides");
  return parsed.map((s) => {
    const slide = { id: s.id || uid(), title: String(s.title || "Untitled"), body: String(s.body || "") };
    if (Array.isArray(s.outline)) slide.outline = s.outline;
    return slide;
  });
};

// ===== Phase 6: element HTML -> nested outline (regex, pure) =====

const _ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };
const _decodeEntities = (s) => String(s || "").replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => _ENTITIES[m]);
const _stripTags = (html) => _decodeEntities(String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());

// One element's HTML -> nested outline: h1-h6, p and li in document order;
// paragraphs/bullets nest under the most recent heading, pre-heading content
// stays top-level. Other tags (div wrappers, img) are ignored. Pure regex.
export const outlineFromHtml = (html) => {
  const nodes = [];
  const re = /<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(String(html || ""))) !== null) {
    const tag = m[1].toLowerCase();
    const text = _stripTags(m[2]);
    if (!text) continue;
    if (/^h[1-6]$/.test(tag)) {
      nodes.push({ type: "heading", level: Number(tag[1]), text, children: [] });
    } else {
      const type = tag === "li" ? "bullet" : "paragraph";
      const parent = nodes.length && nodes[nodes.length - 1].type === "heading" ? nodes[nodes.length - 1] : null;
      if (parent) parent.children.push({ type, text });
      else nodes.push({ type, text });
    }
  }
  return nodes;
};

// The nested outline across a whole page's elements.
export const buildOutlineFromElements = (elements) =>
  (elements || []).flatMap((el) => outlineFromHtml(el && el.html));

// The outline view's "from page" action: the above, headings only — content
// before the first heading (page chrome, orphan ledes) is skipped so every
// entry is a proper section. [] when there is nothing to outline.
export const buildOutlineFromPage = (elements) =>
  buildOutlineFromElements(elements).filter((n) => n.type === "heading");

// ===== Phase 6 Task 4: whole-page HTML -> nested outline (DOM) =====

// Page HTML -> hierarchical outline: headings (h1-h6) open entries in
// document order; the paragraphs, lists and images that FOLLOW a heading
// (until the next heading of any level) nest under it. Headings inside
// nav/footer are chrome, not content — skipped. Browser-only (DOMParser);
// [] in non-DOM environments so callers can guard.
export const buildOutlineFromPageHtml = (html) => {
  if (typeof document === "undefined") return [];
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  const textOf = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
  const outline = [];
  doc.body.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
    if (h.closest("nav, footer")) return;
    const entry = { level: Number(h.tagName[1]), text: textOf(h), children: [] };
    let node = h.nextElementSibling;
    while (node && !/^h[1-6]$/i.test(node.tagName)) {
      const tag = node.tagName.toLowerCase();
      if (tag === "p") {
        const text = textOf(node);
        if (text) entry.children.push({ type: "paragraph", text });
      } else if (tag === "ul" || tag === "ol") {
        node.querySelectorAll("li").forEach((li) => {
          const text = textOf(li);
          if (text) entry.children.push({ type: "bullet", text });
        });
      } else if (tag === "img") {
        const alt = (node.getAttribute("alt") || "").replace(/\s+/g, " ").trim();
        if (alt) entry.children.push({ type: "image", text: alt });
      }
      node = node.nextElementSibling;
    }
    outline.push(entry);
  });
  return outline;
};

// The outline view's "fill from page" action: one slide carrying the page's
// hierarchical outline, or [] when nothing is outline-able (caller toasts).
export const buildOutlineSlidesFromPage = (html, title = "Slide") => {
  const outline = buildOutlineFromPageHtml(html);
  if (outline.length === 0) return [];
  return [{ id: uid(), title: String(title || "Slide"), body: "", outline }];
};

// ===== nested outline <-> markdown slide body =====

// Nested outline -> markdown slide body. Headings render as "##"-up hashes
// (min level 2 — the slide title owns the single H1, and an H1 inside a
// body would split the slide again when re-parsed); bullets as "- ",
// paragraphs as plain lines.
export const outlineToMarkdown = (nodes) =>
  (nodes || [])
    .map((n) => {
      if (!n) return "";
      if (n.type === "heading") {
        const lines = [`${"#".repeat(Math.max(2, Math.min(6, n.level || 2)))} ${n.text}`];
        for (const c of n.children || []) {
          if (!c || !c.text) continue;
          lines.push(c.type === "bullet" ? `- ${c.text}` : c.text);
        }
        return lines.join("\n");
      }
      return n.type === "bullet" ? `- ${n.text}` : n.text;
    })
    .filter(Boolean)
    .join("\n");

// A slide's markdown body -> nested outline nodes (for the tree preview).
export const slideBodyOutline = (body) => {
  const nodes = [];
  for (const raw of String(body || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      nodes.push({ type: "heading", level: h[1].length, text: h[2].trim(), children: [] });
      continue;
    }
    const b = line.match(/^[-*]\s+(.+)$/);
    const type = b ? "bullet" : "paragraph";
    const text = b ? b[1].trim() : line;
    const parent = nodes.length && nodes[nodes.length - 1].type === "heading" ? nodes[nodes.length - 1] : null;
    if (parent) parent.children.push({ type, text });
    else nodes.push({ type, text });
  }
  return nodes;
};
