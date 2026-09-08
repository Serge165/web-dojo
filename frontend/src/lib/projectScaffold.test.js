import { scaffoldProjectFiles } from "./projectScaffold";

const project = {
  id: "p1",
  name: "Acme",
  pages: [{
    id: "home", name: "Home", slug: "index", status: "draft",
    seo: { title: "Acme Home", description: "Welcome to Acme" },
    elements: [{ id: "e1", html: '<section style="padding:32px;"><h1>Hi</h1></section>' }],
    head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "",
  }],
  template: { header_html: "", footer_html: "", use_template: false },
  analytics: {},
};

test("scaffolds the expected file tree (index.html + css/ + js/ + imgs/ + fonts/)", () => {
  const files = scaffoldProjectFiles(project);
  const paths = files.map((f) => f.path);
  expect(paths).toEqual(
    expect.arrayContaining(["index.html", "css/globals.css", "css/styles.css", "js/script.js", "imgs", "fonts"])
  );
  // imgs must be a folder node, not a file.
  const imgs = files.find((f) => f.path === "imgs");
  expect(imgs.type).toBe("folder");
  // Same for fonts (Phase 4a, Task 3).
  const fonts = files.find((f) => f.path === "fonts");
  expect(fonts.type).toBe("folder");
});

test("index.html references css/globals.css and css/styles.css, not the bare globals.css", () => {
  const indexHtml = scaffoldProjectFiles(project).find((f) => f.path === "index.html").content;
  expect(indexHtml).toContain('href="css/globals.css"');
  expect(indexHtml).toContain('href="css/styles.css"');
  expect(indexHtml).not.toContain('href="globals.css"');
  // And it actually carries the page body.
  expect(indexHtml).toContain("<h1>Hi</h1>");
});

test("css/globals.css is non-empty (exporter-extracted theme/base/components)", () => {
  const globals = scaffoldProjectFiles(project).find((f) => f.path === "css/globals.css").content;
  expect(typeof globals).toBe("string");
  expect(globals.length).toBeGreaterThan(0);
});

test("css/styles.css is the seeded author stylesheet, branded with the project name", () => {
  const styles = scaffoldProjectFiles(project).find((f) => f.path === "css/styles.css").content;
  expect(styles.startsWith("/* Acme — styles.css")).toBe(true);
  expect(styles).toContain("--max-width");
});

test("js/script.js is the seeded hand-off when the project defines no forge-js", () => {
  const script = scaffoldProjectFiles(project).find((f) => f.path === "js/script.js").content;
  expect(script).toContain("Acme");
  expect(script).toContain("DOMContentLoaded");
});

test("falls back to a default project name when name is missing", () => {
  const files = scaffoldProjectFiles({ ...project, name: "" });
  const styles = files.find((f) => f.path === "css/styles.css").content;
  expect(styles.startsWith("/* Untitled — styles.css")).toBe(true);
});

test("without opt-in, css/globals.css does NOT contain the site-layout CSS", () => {
  const globals = scaffoldProjectFiles(project).find((f) => f.path === "css/globals.css").content;
  expect(globals).not.toContain("/* ===== Site Layout ===== */");
});
