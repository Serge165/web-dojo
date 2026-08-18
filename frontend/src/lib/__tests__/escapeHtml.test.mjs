import test from "node:test";
import assert from "node:assert/strict";
import { escAttr, escText } from "../escapeHtml.js";

test("escAttr escapes & < > \" '", () => {
  assert.equal(
    escAttr(`<img src=x onerror=alert(1)>&"'`),
    "&lt;img src=x onerror=alert(1)&gt;&amp;&quot;&#39;"
  );
});

test("escAttr handles null/undefined as empty string", () => {
  assert.equal(escAttr(null), "");
  assert.equal(escAttr(undefined), "");
});

test("escAttr preserves plain text unchanged", () => {
  assert.equal(escAttr("Aurora Bottle"), "Aurora Bottle");
});

test("escText escapes & < > but not quotes", () => {
  assert.equal(
    escText(`</title><script>alert(1)</script>`),
    "&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;"
  );
  assert.equal(escText(`He said "hi"`), `He said "hi"`);
});
