import { test } from "node:test";
import assert from "node:assert/strict";
import { techCatalog } from "../data/tech-catalog.js";
import { extractJobTechnologies } from "./extract-job-technologies.js";

test("detects technologies written with different aliases", () => {
  const text = "We use NodeJS, Node.js and Node JS across our services, plus Postgres and PSQL.";
  const result = extractJobTechnologies(text, techCatalog);
  assert.deepEqual(result, ["Node.js", "PostgreSQL"]);
});

test("detects multi-word technologies", () => {
  const text = `
    Looking for someone experienced with React Native, GitHub Actions,
    Google Cloud, Ruby on Rails and SQL Server.
  `;
  const result = extractJobTechnologies(text, techCatalog);
  assert.deepEqual(result, ["GitHub Actions", "Google Cloud", "React Native", "Ruby on Rails", "SQL Server"]);
});

test("is case-insensitive", () => {
  const text = "react, TYPESCRIPT, docker, aws";
  const result = extractJobTechnologies(text, techCatalog);
  assert.deepEqual(result, ["AWS", "Docker", "React", "TypeScript"]);
});

test("removes duplicate mentions of the same technology", () => {
  const text = "React, React.js, ReactJS, react and REACT are all the same thing.";
  const result = extractJobTechnologies(text, techCatalog);
  assert.deepEqual(result, ["React"]);
});

test("returns an empty array when no known technology is mentioned", () => {
  const text = "We are looking for a passionate developer with great communication skills.";
  assert.deepEqual(extractJobTechnologies(text, techCatalog), []);
});

test("returns an empty array for empty input", () => {
  assert.deepEqual(extractJobTechnologies("", techCatalog), []);
  assert.deepEqual(extractJobTechnologies("   ", techCatalog), []);
});

test("results are sorted alphabetically", () => {
  const text = "TypeScript, AWS, Docker, React";
  const result = extractJobTechnologies(text, techCatalog);
  assert.deepEqual(result, ["AWS", "Docker", "React", "TypeScript"]);
});

test("does not false-positive short names inside longer words", () => {
  const text = "We built this with Google Cloud and Cocoa, and our app is popular in Russia thanks to Rust developers.";
  const result = extractJobTechnologies(text, techCatalog);
  assert.ok(!result.includes("Go"), "Go should not match inside Google");
  assert.ok(!result.includes("C"), "C should not match inside Cocoa");
  assert.ok(!result.includes("R"), "R should not match inside Russia or Rust");
  assert.deepEqual(result, ["Google Cloud", "Rust"]);
});

test("does not credit a short alias for text already claimed by a longer alias", () => {
  const text = "Experience with JavaScript, Ruby on Rails and SQL Server required.";
  const result = extractJobTechnologies(text, techCatalog);
  assert.ok(!result.includes("Java"), "Java should not match inside JavaScript");
  assert.ok(!result.includes("Ruby"), "Ruby should not be double-counted separately from Ruby on Rails");
  assert.ok(!result.includes("SQL"), "SQL should not be double-counted separately from SQL Server");
  assert.deepEqual(result, ["JavaScript", "Ruby on Rails", "SQL Server"]);
});

test("still detects a short alias when it appears independently of the longer phrase", () => {
  const text = "We use Ruby and, on a separate project, Ruby on Rails. Java and JavaScript are both used too.";
  const result = extractJobTechnologies(text, techCatalog);
  assert.deepEqual(result, ["Java", "JavaScript", "Ruby", "Ruby on Rails"]);
});

test("handles symbol-adjacent aliases like C++ and C# without false-positiving bare C", () => {
  const text = "Backend written in C++ and C#, with some legacy C code as well.";
  const result = extractJobTechnologies(text, techCatalog);
  assert.deepEqual(result, ["C", "C#", "C++"]);
});

test("does not invent technologies that are not in the pool", () => {
  const text = "React, TypeScript and a made-up framework called Zorbatron.";
  const result = extractJobTechnologies(text, techCatalog);
  assert.deepEqual(result, ["React", "TypeScript"]);
});
