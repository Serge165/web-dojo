// Phase 6 Task 5: parser round-trip validation for every prebuilt page
// layout ("Oxygen-template style" input — portable HTML blocks with inline
// styles). For each layout the export pipeline must lose nothing: every tag
// survives, every inline CSS declaration lands in globals.css, zero
// style=" attributes remain, fonts are linked, and the page is typed.
import { buildMultiPageExport } from "./exportHtml";
import { PAGE_LAYOUTS } from "./pageLayouts";

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)/g;
const tagCounts = (html) => {
  const counts = {};
  for (const m of html.matchAll(TAG_RE)) counts[m[1].toLowerCase()] = (counts[m[1].toLowerCase()] || 0) + 1;
  return counts;
};
const declsOf = (html) =>
  [...html.matchAll(/style="([^"]*)"/g)].flatMap((m) => m[1].split(";")).map((d) => d.trim()).filter(Boolean);

const exportLayout = (layout) => {
  const elements = layout.blocks.map((html, i) => ({ id: `el_${i}`, html }));
  return buildMultiPageExport({
    id: "layout-test",
    name: layout.label,
    fonts: layout.fonts || [],
    pages: [{
      id: "p1", name: layout.label, slug: "index", type: "page",
      elements, head_html: "", canvas_bg: layout.canvasBg || "#ffffff", fonts: layout.fonts || [],
    }],
  });
};

describe.each(PAGE_LAYOUTS.map((l) => [l.label, l]))("page layout round-trip: %s", (_label, layout) => {
  const { files } = exportLayout(layout);
  const html = files["index.html"];
  const css = files["globals.css"];
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  const body = (bodyMatch ? bodyMatch[1] : "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  // Script payloads (e.g. the cart runtime) legitimately carry style= and
  // markup inside JS strings — excluded on BOTH sides of the comparison.
  const original = layout.blocks.join("\n").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  test("exports with zero inline style attributes", () => {
    expect(body).not.toContain('style="');
  });

  test("preserves every tag from the original layout markup", () => {
    expect(tagCounts(body)).toEqual(tagCounts(original));
  });

  test("routes every original inline CSS declaration into globals.css", () => {
    const decls = declsOf(original);
    expect(decls.length).toBeGreaterThan(0);
    for (const d of decls) expect(css).toContain(d);
  });

  test("types the page and links its fonts", () => {
    expect(html).toContain('data-wd-page-type="page"');
    if ((layout.fonts || []).length) expect(html).toContain("fonts.googleapis.com/css2");
  });
});
