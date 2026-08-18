import test from "node:test";
import assert from "node:assert/strict";
import { buildFormHtml, DEFAULT_FORM } from "../forms.js";

test("buildFormHtml still escapes field labels after migrating to shared escapeHtml", () => {
  const config = DEFAULT_FORM();
  config.fields[0].label = "<script>alert(1)</script>";
  const html = buildFormHtml(config);
  assert.ok(!html.includes("<script>alert(1)</script>"), "raw script tag must not appear unescaped");
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "label must be escaped");
});

test("submit script reads window.__WD_PROJECT_ID and appends it as _wd_project", () => {
  const config = DEFAULT_FORM();
  const html = buildFormHtml(config);
  assert.ok(html.includes("fd.append('_wd_project',window.__WD_PROJECT_ID||'')"), "runtime script must append _wd_project from the page-level global");
});
