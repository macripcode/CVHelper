import type { VacancyDetails } from "@cvhelper/shared";
import { callGemini } from "./geminiClient.js";

const SCALAR_FIELDS = ["company", "role", "seniority", "workMode", "location", "salary"] as const;

export type ExtractedVacancyDetails = Partial<Pick<VacancyDetails, (typeof SCALAR_FIELDS)[number]>> & {
  requiredLanguages?: string[];
};

function buildPrompt(jobDescription: string): string {
  return [
    "You will be given the full text of a job posting.",
    "Extract the following fields and reply with ONLY a single-line JSON object, no markdown code fences, no extra words:",
    '{"company": "...", "role": "...", "seniority": "...", "workMode": "...", "location": "...", "salary": "...", "requiredLanguages": ["..."]}',
    "",
    "Field meanings:",
    "- company: the hiring company's name",
    "- role: the job title",
    '- seniority: e.g. "Junior", "Mid", "Senior", "Staff" — as implied by the text',
    '- workMode: e.g. "Remote", "Hybrid", "On-site"',
    "- location: city/country or region mentioned for the role",
    "- salary: the compensation range or amount, exactly as written",
    '- requiredLanguages: an array of natural/human languages required or preferred for the role (e.g. "English", "Spanish") — NOT programming languages. Empty array if none are mentioned.',
    "",
    'Use an empty string "" (or an empty array for requiredLanguages) for anything that cannot be determined from the text. Do not guess or fabricate values.',
    "",
    "Job posting:",
    jobDescription,
  ].join("\n");
}

function stripCodeFence(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return match ? match[1] : text;
}

/**
 * Extracts vacancy-level fields (company, role, seniority, work mode, location, salary, required
 * languages) from raw job posting text in a single Gemini call. This is the app's one deliberate AI
 * call (see CLAUDE.md) — fields that can't be determined are simply omitted rather than guessed.
 */
export async function extractVacancyDetails(jobDescription: string): Promise<ExtractedVacancyDetails> {
  const trimmed = jobDescription.trim();
  if (!trimmed) return {};

  const text = await callGemini(buildPrompt(trimmed));
  if (!text) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(text));
  } catch {
    return {};
  }

  if (typeof parsed !== "object" || parsed === null) return {};
  const record = parsed as Record<string, unknown>;

  const result: ExtractedVacancyDetails = {};
  for (const field of SCALAR_FIELDS) {
    const value = record[field];
    if (typeof value === "string" && value.trim()) {
      result[field] = value.trim();
    }
  }

  if (Array.isArray(record.requiredLanguages)) {
    const languages = record.requiredLanguages
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
    if (languages.length > 0) result.requiredLanguages = languages;
  }

  return result;
}
