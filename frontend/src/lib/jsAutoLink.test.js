import { linkJsInHtml, unlinkJsInHtml, relinkJsInHtml, isJsFilePath, fileNameOf } from "./jsAutoLink";

const DOC = "<!DOCTYPE html>\n<html>\n<head><title>T</title></head>\n<body>\n  <h1>Hi</h1>\n</body>\n</html>\n";

describe("linkJsInHtml", () => {
  it("inserts the script tag right before </body>", () => {
    const out = linkJsInHtml(DOC, "modal.js");
    expect(out).toContain('<script src="js/modal.js"></script>');
    expect(out.indexOf("js/modal.js")).toBeLessThan(out.indexOf("</body>"));
    expect(out).toContain("<h1>Hi</h1>");
  });

  it("accepts bare names and js/-prefixed paths identically", () => {
    expect(linkJsInHtml(DOC, "modal.js")).toBe(linkJsInHtml(DOC, "js/modal.js"));
  });

  it("is idempotent — re-linking a name does not duplicate the tag", () => {
    const once = linkJsInHtml(DOC, "modal.js");
    const twice = linkJsInHtml(once, "modal.js");
    expect(twice).toBe(once);
    expect((twice.match(/js\/modal\.js/g) || []).length).toBe(1);
  });

  it("detects an existing hand-written tag as already linked (any attribute order)", () => {
    const pre = DOC.replace("</body>", '<script defer src="js/app.js" ></script>\n</body>');
    expect(linkJsInHtml(pre, "app.js")).toBe(pre);
  });

  it("appends when there is no </body> at all", () => {
    const out = linkJsInHtml("<div>no shell</div>", "modal.js");
    expect(out).toContain('<script src="js/modal.js"></script>');
  });

  it("links multiple files in one call", () => {
    const out = linkJsInHtml(DOC, ["a.js", "b.js"]);
    expect(out).toContain('src="js/a.js"');
    expect(out).toContain('src="js/b.js"');
  });

  it("ignores empty names and non-.js names", () => {
    expect(linkJsInHtml(DOC, ["", "styles.css", null])).toBe(DOC);
  });
});

describe("unlinkJsInHtml", () => {
  it("removes exactly the matching tag, leaving neighbours intact", () => {
    const two = linkJsInHtml(linkJsInHtml(DOC, "a.js"), "b.js");
    const one = unlinkJsInHtml(two, "a.js");
    expect(one).toContain('src="js/b.js"');
    expect(one).not.toContain('src="js/a.js"');
  });

  it("is safe on documents that never linked the name", () => {
    expect(unlinkJsInHtml(DOC, "ghost.js")).toBe(DOC);
  });
});

describe("relinkJsInHtml", () => {
  it("re-points the tag to the new filename", () => {
    const linked = linkJsInHtml(DOC, "modal.js");
    const out = relinkJsInHtml(linked, "modal.js", "dialog.js");
    expect(out).not.toContain("js/modal.js");
    expect(out).toContain('<script src="js/dialog.js"></script>');
  });

  it("handles renames when the tag was never linked (creates the new one)", () => {
    const out = relinkJsInHtml(DOC, "ghost.js", "dialog.js");
    expect(out).toContain('<script src="js/dialog.js"></script>');
  });

  it("is idempotent for a no-op rename target already present", () => {
    const out = relinkJsInHtml(DOC, "modal.js", "dialog.js");
    expect(relinkJsInHtml(out, "dialog.js", "dialog.js")).toBe(out);
  });
});

describe("path predicates", () => {
  it("isJsFilePath accepts only real .js files directly under js/", () => {
    expect(isJsFilePath("js/modal.js")).toBe(true);
    expect(isJsFilePath("js/nested/mod.js")).toBe(false);
    expect(isJsFilePath("css/site.css")).toBe(false);
    expect(isJsFilePath("js/notes.txt")).toBe(false);
    expect(isJsFilePath(null)).toBe(false);
  });

  it("fileNameOf extracts the filename or returns null", () => {
    expect(fileNameOf("js/modal.js")).toBe("modal.js");
    expect(fileNameOf("imgs/pic.png")).toBeNull();
  });
});
