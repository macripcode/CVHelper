import type { JobFitResult, TechnologyDefinition } from "../types/technology.types.js";
import { extractJobTechnologies } from "./extract-job-technologies.js";
import { normalizeTechnologies } from "./normalize-technology.js";

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Compares the technologies detected in a job posting against the technologies
 * the candidate knows, and returns a compatibility summary.
 */
export function analyzeJobFit(
  jobDescription: string,
  myTechnologies: string[],
  techCatalog: TechnologyDefinition[],
): JobFitResult {
  const jobTechnologies = extractJobTechnologies(jobDescription, techCatalog);
  const knownTechnologies = new Set(normalizeTechnologies(myTechnologies, techCatalog));

  const matchedTechnologies = jobTechnologies.filter((tech) => knownTechnologies.has(tech));
  const missingTechnologies = jobTechnologies.filter((tech) => !knownTechnologies.has(tech));

  const requiredCount = jobTechnologies.length;
  const matchedCount = matchedTechnologies.length;
  const fitPercentage = requiredCount === 0 ? 0 : roundToTwoDecimals((matchedCount / requiredCount) * 100);

  return {
    jobTechnologies,
    matchedTechnologies,
    missingTechnologies,
    fitPercentage,
    matchedCount,
    requiredCount,
  };
}
