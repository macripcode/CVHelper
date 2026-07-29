import {
  EMPLOYMENT_TYPES,
  EMPTY_JOB_POSTING_ANALYSIS,
  SENIORITY_LEVELS,
  WORK_MODES,
  type EmploymentType,
  type JobPostingAnalysis,
  type Seniority,
  type WorkMode,
} from "./types.js";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function toStringArray(value: unknown, limit?: number): string[] {
  if (!Array.isArray(value)) return [];
  const strings = value.filter(isNonEmptyString).map((v) => v.trim());
  const deduped = Array.from(new Set(strings));
  return typeof limit === "number" ? deduped.slice(0, limit) : deduped;
}

function toEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/**
 * Extracts the first top-level `{...}` block from arbitrary text — a fallback for when Gemini
 * wraps its JSON in markdown fences or adds stray text despite the structured-output request.
 */
function extractJsonBlock(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start !== -1 && end !== -1 && end > start ? text.slice(start, end + 1) : text;
}

/** Parses and sanitizes a raw Gemini response into a safe JobPostingAnalysis — never throws. */
export function validateJobPostingAnalysis(rawText: string): JobPostingAnalysis {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonBlock(rawText));
  } catch {
    return EMPTY_JOB_POSTING_ANALYSIS;
  }

  if (typeof parsed !== "object" || parsed === null) return EMPTY_JOB_POSTING_ANALYSIS;
  const record = parsed as Record<string, unknown>;

  const salary =
    typeof record.salary === "object" &&
    record.salary !== null &&
    isNonEmptyString((record.salary as Record<string, unknown>).currency) &&
    typeof (record.salary as Record<string, unknown>).min === "number" &&
    typeof (record.salary as Record<string, unknown>).max === "number" &&
    isNonEmptyString((record.salary as Record<string, unknown>).period)
      ? {
          currency: ((record.salary as Record<string, unknown>).currency as string).trim(),
          min: (record.salary as Record<string, unknown>).min as number,
          max: (record.salary as Record<string, unknown>).max as number,
          period: ((record.salary as Record<string, unknown>).period as string).trim(),
        }
      : null;

  const location = toStringArray(record.location);

  return {
    company: isNonEmptyString(record.company) ? record.company.trim() : null,
    role: isNonEmptyString(record.role) ? record.role.trim() : null,
    seniority: toEnum<Seniority>(record.seniority, SENIORITY_LEVELS),
    location: location.length > 0 ? location : null,
    workMode: toEnum<WorkMode>(record.workMode, WORK_MODES),
    employmentType: toEnum<EmploymentType>(record.employmentType, EMPLOYMENT_TYPES),
    salary,
    requiredExperience: typeof record.requiredExperience === "number" ? record.requiredExperience : null,
    technologies: toStringArray(record.technologies),
    requiredLanguages: toStringArray(record.requiredLanguages),
    responsibilities: toStringArray(record.responsibilities, 10),
    requirements: toStringArray(record.requirements, 10),
    preferredQualifications: toStringArray(record.preferredQualifications, 10),
    professionalProfileSummary: isNonEmptyString(record.professionalProfileSummary)
      ? record.professionalProfileSummary.trim()
      : null,
  };
}
