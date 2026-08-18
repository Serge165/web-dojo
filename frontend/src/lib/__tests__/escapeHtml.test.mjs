import test from "node:test";
import assert from "node:assert/strict";
import { escAttr, escText, unescapeHtml, escJsAttr, escJsScript } from "../escapeHtml.js";

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

test("unescapeHtml reverses escAttr for a round trip", () => {
  const original = `<img src=x onerror=alert(1)>&"'`;
  assert.equal(unescapeHtml(escAttr(original)), original);
});

test("unescapeHtml decodes a real-world URL with an ampersand", () => {
  assert.equal(unescapeHtml("https://x.com/p.jpg?w=800&amp;q=80"), "https://x.com/p.jpg?w=800&q=80");
});

test("escJsAttr produces a JS string literal safe inside a double-quoted HTML attribute", () => {
  const label = '" onmouseover="alert(1)';
  const result = escJsAttr(label);
  assert.ok(!result.includes('"'), "no raw double-quote characters may remain in the HTML-attribute-escaped output");
  assert.ok(result.startsWith("&quot;") && result.endsWith("&quot;"), "still starts/ends with the (now-escaped) JSON string delimiters");
});

test("escJsAttr round-trips back to the original value via JSON.parse after simulating HTML entity decoding", () => {
  const label = 'Pause "now" & continue';
  const attrValue = escJsAttr(label);
  // Simulate what the browser's HTML parser does to an attribute value before JS sees it.
  const decoded = attrValue.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  assert.equal(JSON.parse(decoded), label);
});

test("escJsScript prevents </script> breakout inside a <script> block", () => {
  const label = "</script><script>alert(1)</script>";
  const result = escJsScript(label);
  assert.ok(!result.includes("</script"), "the literal </script substring must never appear");
  assert.equal(JSON.parse(result.replace(/\\u003C/g, "<")), label);
});
