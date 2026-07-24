import { test } from "node:test";
import assert from "node:assert/strict";
import { techCatalog } from "../data/tech-catalog.js";
import { analyzeJobFit } from "./analyze-job-fit.js";

test("matches the reference example exactly", () => {
  const myTechnologies = ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Docker"];
  const jobDescription = `
    We are looking for a Full Stack Developer with experience in
    React, TypeScript, NodeJS, PostgreSQL, AWS, Docker, Kubernetes
    and Jest.
  `;

  const result = analyzeJobFit(jobDescription, myTechnologies, techCatalog);

  assert.deepEqual(result, {
    jobTechnologies: ["AWS", "Docker", "Jest", "Kubernetes", "Node.js", "PostgreSQL", "React", "TypeScript"],
    matchedTechnologies: ["Docker", "Node.js", "PostgreSQL", "React", "TypeScript"],
    missingTechnologies: ["AWS", "Jest", "Kubernetes"],
    fitPercentage: 62.5,
    matchedCount: 5,
    requiredCount: 8,
  });
});

test("100% fit when the candidate knows every required technology", () => {
  const myTechnologies = ["React", "TypeScript", "Docker"];
  const jobDescription = "Looking for a developer with React, TypeScript and Docker experience.";

  const result = analyzeJobFit(jobDescription, myTechnologies, techCatalog);

  assert.deepEqual(result.jobTechnologies, ["Docker", "React", "TypeScript"]);
  assert.deepEqual(result.matchedTechnologies, ["Docker", "React", "TypeScript"]);
  assert.deepEqual(result.missingTechnologies, []);
  assert.equal(result.fitPercentage, 100);
  assert.equal(result.matchedCount, 3);
  assert.equal(result.requiredCount, 3);
});

test("50% fit when the candidate knows half of the required technologies", () => {
  const myTechnologies = ["React", "Docker"];
  const jobDescription = "Looking for a developer with React, Docker, Kubernetes and AWS experience.";

  const result = analyzeJobFit(jobDescription, myTechnologies, techCatalog);

  assert.equal(result.requiredCount, 4);
  assert.equal(result.matchedCount, 2);
  assert.equal(result.fitPercentage, 50);
});

test("0% fit when the candidate knows none of the required technologies", () => {
  const myTechnologies = ["Kotlin", "Swift"];
  const jobDescription = "Looking for a developer with React, TypeScript and Docker experience.";

  const result = analyzeJobFit(jobDescription, myTechnologies, techCatalog);

  assert.deepEqual(result.matchedTechnologies, []);
  assert.deepEqual(result.missingTechnologies, ["Docker", "React", "TypeScript"]);
  assert.equal(result.fitPercentage, 0);
  assert.equal(result.matchedCount, 0);
  assert.equal(result.requiredCount, 3);
});

test("fitPercentage is 0 (not NaN) when the job posting has no recognizable technologies", () => {
  const result = analyzeJobFit("Great communication and teamwork skills required.", ["React"], techCatalog);

  assert.deepEqual(result, {
    jobTechnologies: [],
    matchedTechnologies: [],
    missingTechnologies: [],
    fitPercentage: 0,
    matchedCount: 0,
    requiredCount: 0,
  });
});

test("rounds fitPercentage to at most two decimals", () => {
  const myTechnologies = ["React", "TypeScript", "Docker"];
  const jobDescription = "React, TypeScript, Docker, AWS, Kubernetes, Jest, GraphQL experience needed.";

  const result = analyzeJobFit(jobDescription, myTechnologies, techCatalog);

  assert.equal(result.requiredCount, 7);
  assert.equal(result.matchedCount, 3);
  assert.equal(result.fitPercentage, 42.86);
});

test("normalizes the candidate's technologies (including aliases) before comparing", () => {
  const myTechnologies = ["ReactJS", "NodeJS", "Postgres", "Amazon Web Services"];
  const jobDescription = "We need React, Node.js, PostgreSQL and AWS experience.";

  const result = analyzeJobFit(jobDescription, myTechnologies, techCatalog);

  assert.deepEqual(result.jobTechnologies, ["AWS", "Node.js", "PostgreSQL", "React"]);
  assert.deepEqual(result.matchedTechnologies, ["AWS", "Node.js", "PostgreSQL", "React"]);
  assert.deepEqual(result.missingTechnologies, []);
  assert.equal(result.fitPercentage, 100);
});
