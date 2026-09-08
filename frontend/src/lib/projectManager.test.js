import { applyTemplate, hasProjectContent } from "./projectManager";

const heroBlock = { id: "h1", html: "<section>Hero</section>" };
const textBlock = { id: "t1", html: "<p>Text</p>" };
const buttonBlock = { id: "b1", html: "<button>Click</button>" };

const currentProject = {
  id: "proj-1",
  name: "My Project",
  head_html: '<style data-forge-vars>:root { --fc-primary: #333; }</style>',
  canvas_bg: "#f0f0f0",
  fonts: ["Inter"],
  elements: [heroBlock, textBlock],
  pages: [{ id: "p1", name: "Home", slug: "index", elements: [heroBlock, textBlock], head_html: "", canvas_bg: "#f0f0f0", fonts: ["Inter"], }],
  template: { header_html: "", footer_html: "", use_template: false },
  analytics: {},
  metadata: {},
};

const template = {
  id: "tpl-dark",
  name: "Dark Theme",
  data: {
    head_html: '<style data-forge-vars>:root { --fc-primary: #111; --fc-bg: #222; }</style>',
    canvas_bg: "#111111",
    fonts: ["Inter", "Roboto"],
    pages: [{ id: "tp1", name: "Home", slug: "index", elements: [buttonBlock], head_html: "", canvas_bg: "#111111", fonts: [] }],
    elements: [buttonBlock],
  },
};

describe("applyTemplate", () => {
  test("wrap mode preserves current blocks", () => {
    const result = applyTemplate(currentProject, template, "wrap");
    // wrap returns only merged metadata, does not modify elements
    expect(result).not.toBeNull();
    expect(result.head_html).toContain("--fc-primary: #333");
    expect(result.head_html).toContain("--fc-primary: #111");
    expect(result.head_html).toContain("--fc-bg: #222");
  });

  test("wrap mode merges template fonts into current fonts (deduped)", () => {
    const result = applyTemplate(currentProject, template, "wrap");
    expect(result.fonts).toContain("Inter");
    expect(result.fonts).toContain("Roboto");
    // "Inter" should appear only once
    expect(result.fonts.filter((f) => f === "Inter")).toHaveLength(1);
  });

  test("wrap mode adds template metadata", () => {
    const result = applyTemplate(currentProject, template, "wrap");
    expect(result.metadata.appliedTemplate).toBe("tpl-dark");
    expect(result.metadata.appliedAt).toBeDefined();
  });

  test("new mode returns null (caller creates fresh project)", () => {
    const result = applyTemplate(currentProject, template, "new");
    expect(result).toBeNull();
  });

  test("wrap mode applies canvas_bg from template when current is default", () => {
    const blankProject = {
      ...currentProject,
      canvas_bg: "#ffffff",
    };
    const result = applyTemplate(blankProject, template, "wrap");
    expect(result.canvas_bg).toBe("#111111");
  });

  test("wrap mode keeps current canvas_bg when template is default", () => {
    const tplWithDefaultBg = {
      ...template,
      data: { ...template.data, canvas_bg: "#ffffff" },
    };
    const result = applyTemplate(currentProject, tplWithDefaultBg, "wrap");
    expect(result.canvas_bg).toBe("#f0f0f0");
  });

  test("hasProjectContent returns false for empty project", () => {
    const empty = {
      pages: [{ id: "p1", name: "Home", elements: [], head_html: "" }],
    };
    expect(hasProjectContent(empty)).toBe(false);
  });

  test("hasProjectContent returns true for project with elements", () => {
    expect(hasProjectContent(currentProject)).toBe(true);
  });

  test("hasProjectContent returns true for project with head_html", () => {
    const hasHead = {
      pages: [{ id: "p1", name: "Home", elements: [], head_html: "<style>:root{}</style>" }],
    };
    expect(hasProjectContent(hasHead)).toBe(true);
  });

  test("hasProjectContent returns true for multi-page project", () => {
    const multi = {
      pages: [
        { id: "p1", name: "Home", elements: [] },
        { id: "p2", name: "About", elements: [] },
      ],
    };
    expect(hasProjectContent(multi)).toBe(true);
  });
});