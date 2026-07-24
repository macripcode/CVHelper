import type { VacancyDetails } from "@cvhelper/shared";
import { callGemini } from "./geminiClient.js";

const FIELDS = ["company", "role", "seniority", "workMode", "location", "salary"] as const;

export type ExtractedVacancyDetails = Partial<Pick<VacancyDetails, (typeof FIELDS)[number]>>;

function buildPrompt(jobDescription: string): string {
  return [
    "You will be given the full text of a job posting.",
    "Extract the following fields and reply with ONLY a single-line JSON object, no markdown code fences, no extra words:",
    '{"company": "...", "role": "...", "seniority": "...", "workMode": "...", "location": "...", "salary": "..."}',
    "",
    "Field meanings:",
    "- company: the hiring company's name",
    "- role: the job title",
    '- seniority: e.g. "Junior", "Mid", "Senior", "Staff" — as implied by the text',
    '- workMode: e.g. "Remote", "Hybrid", "On-site"',
    "- location: city/country or region mentioned for the role",
    "- salary: the compensation range or amount, exactly as written",
    "",
    'Use an empty string "" for any field that cannot be determined from the text. Do not guess or fabricate values.',
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
 * Extracts vacancy-level fields (company, role, seniority, work mode, location, salary) from raw
 * job posting text in a single Gemini call. This is the app's one deliberate AI call (see CLAUDE.md) —
 * fields that can't be determined are simply omitted rather than guessed.
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

  const result: ExtractedVacancyDetails = {};
  for (const field of FIELDS) {
    const value = (parsed as Record<string, unknown>)[field];
    if (typeof value === "string" && value.trim()) {
      result[field] = value.trim();
    }
  }
  return result;
}
