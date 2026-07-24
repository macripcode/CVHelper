export type { TechnologyDefinition, JobFitResult } from "./types/technology.types.js";
export { techCatalog } from "./data/tech-catalog.js";
export { normalizeTechnology, normalizeTechnologies } from "./utils/normalize-technology.js";
export { extractJobTechnologies } from "./utils/extract-job-technologies.js";
export { analyzeJobFit } from "./utils/analyze-job-fit.js";
