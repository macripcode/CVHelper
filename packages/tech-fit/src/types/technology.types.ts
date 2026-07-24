/** A single technology entry in the local catalog. */
export type TechnologyDefinition = {
  name: string;
  aliases: string[];
  category?: string;
};

/** Result of comparing a job posting's technologies against the ones the user knows. */
export type JobFitResult = {
  jobTechnologies: string[];
  matchedTechnologies: string[];
  missingTechnologies: string[];
  fitPercentage: number;
  matchedCount: number;
  requiredCount: number;
};
