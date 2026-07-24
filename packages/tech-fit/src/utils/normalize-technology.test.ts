import { test } from "node:test";
import assert from "node:assert/strict";
import { techCatalog } from "../data/tech-catalog.js";
import { normalizeTechnology, normalizeTechnologies } from "./normalize-technology.js";

test("normalizeTechnology resolves common aliases to the canonical name", () => {
  assert.equal(normalizeTechnology("ReactJS", techCatalog), "React");
  assert.equal(normalizeTechnology("NodeJS", techCatalog), "Node.js");
  assert.equal(normalizeTechnology("Postgres", techCatalog), "PostgreSQL");
  assert.equal(normalizeTechnology("Amazon Web Services", techCatalog), "AWS");
});

test("normalizeTechnology ignores case and extra whitespace", () => {
  assert.equal(normalizeTechnology("  reactjs  ", techCatalog), "React");
  assert.equal(normalizeTechnology("node   js", techCatalog), "Node.js");
  assert.equal(normalizeTechnology("POSTGRES", techCatalog), "PostgreSQL");
});

test("normalizeTechnology passes through unknown technologies unchanged", () => {
  assert.equal(normalizeTechnology("Zig", techCatalog), "Zig");
  assert.equal(normalizeTechnology("  Some Internal Tool  ", techCatalog), "Some Internal Tool");
});

test("normalizeTechnology returns an empty string for empty input", () => {
  assert.equal(normalizeTechnology("", techCatalog), "");
  assert.equal(normalizeTechnology("   ", techCatalog), "");
});

test("normalizeTechnologies normalizes, deduplicates, and sorts alphabetically", () => {
  const result = normalizeTechnologies(
    ["ReactJS", "React", "react", "NodeJS", "Postgres", "Amazon Web Services"],
    techCatalog,
  );
  assert.deepEqual(result, ["AWS", "Node.js", "PostgreSQL", "React"]);
});

test("normalizeTechnologies drops empty entries", () => {
  const result = normalizeTechnologies(["React", "", "   "], techCatalog);
  assert.deepEqual(result, ["React"]);
});
