import { upsertRootVar, removeRootVarsForElement } from "./rootVars";

test("upsertRootVar creates a :root block from empty headHtml", () => {
  const out = upsertRootVar("", "--fc-el1-bg", "#ff00ff");
  expect(out).toContain(":root {");
  expect(out).toContain("--fc-el1-bg: #ff00ff;");
});

test("upsertRootVar updates an existing declaration in place, no duplicate", () => {
  const first = upsertRootVar("", "--fc-el1-bg", "#ff00ff");
  const second = upsertRootVar(first, "--fc-el1-bg", "#00ff00");
  expect(second.match(/--fc-el1-bg/g)).toHaveLength(1);
  expect(second).toContain("--fc-el1-bg: #00ff00;");
});

test("upsertRootVar preserves other declarations and other head content", () => {
  const withOne = upsertRootVar("<title>Hi</title>", "--fc-el1-bg", "#ff00ff");
  const withTwo = upsertRootVar(withOne, "--fc-el2-text", "#000000");
  expect(withTwo).toContain("<title>Hi</title>");
  expect(withTwo).toContain("--fc-el1-bg: #ff00ff;");
  expect(withTwo).toContain("--fc-el2-text: #000000;");
});

test("removeRootVarsForElement drops only that element's declarations", () => {
  let h = upsertRootVar("", "--fc-el1-bg", "#ff00ff");
  h = upsertRootVar(h, "--fc-el2-bg", "#00ff00");
  const out = removeRootVarsForElement(h, "el1");
  expect(out).not.toContain("--fc-el1-bg");
  expect(out).toContain("--fc-el2-bg: #00ff00;");
});

test("removeRootVarsForElement drops the whole block once it's empty", () => {
  const h = upsertRootVar("", "--fc-el1-bg", "#ff00ff");
  const out = removeRootVarsForElement(h, "el1");
  expect(out).toBe("");
});

test("removeRootVarsForElement is a no-op when there's no vars block", () => {
  expect(removeRootVarsForElement("<title>Hi</title>", "el1")).toBe("<title>Hi</title>");
});

test("removeRootVarsForElement drops the whole block cleanly when head_html had prior content", () => {
  const h = upsertRootVar("<title>Hi</title>", "--fc-el1-bg", "#ff00ff");
  const out = removeRootVarsForElement(h, "el1");
  expect(out).toBe("<title>Hi</title>");
});
