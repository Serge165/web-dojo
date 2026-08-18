import test from "node:test";
import assert from "node:assert/strict";
import { reconcileElementsFromHtml } from "../htmlPaneSync.js";

const fakeUid = (() => {
  let n = 0;
  return () => `el_new${n++}`;
})();

test("a parsed node whose id matches an existing element updates that element's html in place", () => {
  const current = [{ id: "el_a", html: '<div id="el_a" style="color:red;">old</div>' }];
  const parsed = [{ id: "el_a", outerHTML: '<div id="el_a" style="color:blue;">new</div>' }];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.deepEqual(next, [{ id: "el_a", html: '<div id="el_a" style="color:blue;">new</div>' }]);
});

test("a parsed node with no id becomes a new element with a fresh id", () => {
  const current = [];
  const parsed = [{ id: null, outerHTML: "<p>brand new</p>" }];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.equal(next.length, 1);
  assert.ok(next[0].id.startsWith("el_new"));
  assert.equal(next[0].html, "<p>brand new</p>");
});

test("a parsed node with an unrecognized id becomes a new element rather than matching nothing", () => {
  const current = [{ id: "el_a", html: '<div id="el_a">A</div>' }];
  const parsed = [
    { id: "el_a", outerHTML: '<div id="el_a">A</div>' },
    { id: "el_unknown", outerHTML: '<div id="el_unknown">B</div>' },
  ];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.equal(next.length, 2);
  assert.equal(next[0].id, "el_a");
  assert.notEqual(next[1].id, "el_unknown"); // gets a fresh id, not the DOM id it happened to have
});

test("an existing element whose id no longer appears in parsedNodes is removed", () => {
  const current = [
    { id: "el_a", html: '<div id="el_a">A</div>' },
    { id: "el_b", html: '<div id="el_b">B</div>' },
  ];
  const parsed = [{ id: "el_a", outerHTML: '<div id="el_a">A</div>' }];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.equal(next.length, 1);
  assert.equal(next[0].id, "el_a");
});

test("the returned array follows parsedNodes order, including a reorder", () => {
  const current = [
    { id: "el_a", html: '<div id="el_a">A</div>' },
    { id: "el_b", html: '<div id="el_b">B</div>' },
  ];
  const parsed = [
    { id: "el_b", outerHTML: '<div id="el_b">B</div>' },
    { id: "el_a", outerHTML: '<div id="el_a">A</div>' },
  ];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.deepEqual(next.map((e) => e.id), ["el_b", "el_a"]);
});

test("preserves extra fields (hidden, zIndex) on an updated element instead of dropping them", () => {
  const current = [{ id: "el_a", html: '<div id="el_a">old</div>', hidden: true, zIndex: 3 }];
  const parsed = [{ id: "el_a", outerHTML: '<div id="el_a">new</div>' }];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.deepEqual(next, [{ id: "el_a", html: '<div id="el_a">new</div>', hidden: true, zIndex: 3 }]);
});
