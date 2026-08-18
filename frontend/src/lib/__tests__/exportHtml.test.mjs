import test from "node:test";
import assert from "node:assert/strict";

test("project id injection pattern produces valid, safe JS for a UUID-shaped id", () => {
  const project = { id: "550e8400-e29b-41d4-a716-446655440000" };
  const line = `<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>`;
  assert.equal(line, '<script>window.__WD_PROJECT_ID="550e8400-e29b-41d4-a716-446655440000";</script>');
});

test("project id injection pattern falls back to empty string when id is missing", () => {
  const project = {};
  const line = `<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>`;
  assert.equal(line, '<script>window.__WD_PROJECT_ID="";</script>');
});
