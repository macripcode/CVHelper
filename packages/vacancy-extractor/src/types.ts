export const SENIORITY_LEVELS = ["Intern", "Junior", "Mid", "Senior", "Staff", "Lead", "Principal"] as const;
export type Seniority = (typeof SENIORITY_LEVELS)[number];

export const WORK_MODES = ["Remote", "Hybrid", "On-site"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Temporary", "Internship", "Freelance"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export interface SalaryRange {
  currency: string;
  min: number;
  max: number;
  period: string;
}

/**
 * Full structured analysis of a job posting, extracted in a single Gemini call.
 * Every field is null (or an empty array, for list fields) when it can't be determined
 * with confidence from the text — never guessed or fabricated.
 */
export interface JobPostingAnalysis {
  company: string | null;
  role: string | null;
  seniority: Seniority | null;
  /** Always an array, even for a single location (e.g. ["Remote"]), to avoid a polymorphic string|string[] shape. */
  location: string[] | null;
  workMode: WorkMode | null;
  employmentType: EmploymentType | null;
  salary: SalaryRange | null;
  requiredExperience: number | null;
  technologies: string[];
  /** Natural/human languages required or preferred for the role (e.g. "English", "Spanish") — not programming languages. */
  requiredLanguages: string[];
  responsibilities: string[];
  requirements: string[];
  preferredQualifications: string[];
}

export const EMPTY_JOB_POSTING_ANALYSIS: JobPostingAnalysis = {
  company: null,
  role: null,
  seniority: null,
  location: null,
  workMode: null,
  employmentType: null,
  salary: null,
  requiredExperience: null,
  technologies: [],
  requiredLanguages: [],
  responsibilities: [],
  requirements: [],
  preferredQualifications: [],
};
