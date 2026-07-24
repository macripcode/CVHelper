import { analyzeJobFit, extractJobTechnologies, techCatalog } from "../src/index.js";

const myTechnologies = ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Docker"];

const jobDescription = `
  We are looking for a Full Stack Developer with experience in
  React, TypeScript, NodeJS, PostgreSQL, AWS, Docker, Kubernetes
  and Jest.
`;

console.log("Technologies detected in the job posting:");
console.log(extractJobTechnologies(jobDescription, techCatalog));

console.log("\nFull compatibility analysis:");
console.log(analyzeJobFit(jobDescription, myTechnologies, techCatalog));
