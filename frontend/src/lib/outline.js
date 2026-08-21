import { saveAs } from "file-saver";

const uid = () => "slide_" + Math.random().toString(36).slice(2, 10);

// Markdown outline -> slides. Each top-level heading (# Title) starts a new
// slide; everything until the next H1 becomes that slide's body, verbatim.
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
  return slides.map((s) => ({ ...s, body: s.body.trim() }));
};

export const exportOutlineJson = (slides, name = "outline") => {
  const blob = new Blob([JSON.stringify(slides, null, 2)], { type: "application/json;charset=utf-8" });
  saveAs(blob, `${name.replace(/\s+/g, "-").toLowerCase()}.json`);
};

// Throws on malformed input — caller shows the message as a toast.
export const importOutlineJson = (text) => {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Expected a JSON array of slides");
  return parsed.map((s) => ({ id: s.id || uid(), title: String(s.title || "Untitled"), body: String(s.body || "") }));
};
