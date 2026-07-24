import { buildJobPostingPrompt } from "./buildJobPostingPrompt.js";
import { generateStructuredJson } from "./geminiClient.js";
import { jobPostingSchema } from "./jobPostingSchema.js";
import { EMPTY_JOB_POSTING_ANALYSIS, type JobPostingAnalysis } from "./types.js";
import { validateJobPostingAnalysis } from "./validateJobPostingAnalysis.js";

/**
 * Extracts a full structured analysis of a job posting in a single Gemini call, using the model's
 * native structured-output mode (responseSchema) so the result is JSON by construction. This is the
 * app's one deliberate AI call (see CLAUDE.md) — fields the model can't determine with confidence
 * come back as null/[] rather than guessed.
 */
export async function extractJobPosting(jobDescription: string): Promise<JobPostingAnalysis> {
  const trimmed = jobDescription.trim();
  if (!trimmed) return EMPTY_JOB_POSTING_ANALYSIS;

  const rawText = await generateStructuredJson(buildJobPostingPrompt(trimmed), jobPostingSchema);
  if (!rawText) return EMPTY_JOB_POSTING_ANALYSIS;

  return validateJobPostingAnalysis(rawText);
}
