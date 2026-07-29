export interface HealthResponse {
  status: "ok";
  timestamp: string;
}

export interface CandidatePersonal {
  name: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface CandidateProject {
  name: string;
  goals: string[];
}

export interface CandidateExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  /** Flat achievements for this experience, used only when `projects` is empty. */
  achievements: string[];
  /** Sub-projects under this employer (e.g. multiple client projects under one contracting company).
   *  When non-empty, these render instead of `achievements`. */
  projects: CandidateProject[];
}

export interface CandidateLanguage {
  language: string;
  level: string;
}

export interface CandidateEducation {
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface CandidateSalary {
  amount: number | null;
  currency: string;
  period: string;
}

export interface Candidate {
  personal: CandidatePersonal;
  summary: string;
  experience: CandidateExperience[];
  education: CandidateEducation[];
  techStack: string[];
  softSkills: string[];
  languages: CandidateLanguage[];
  expectedSalary: CandidateSalary;
}

export const EMPTY_CANDIDATE: Candidate = {
  personal: {
    name: "",
    professionalTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
  },
  summary: "",
  experience: [],
  education: [],
  techStack: [],
  softSkills: [],
  languages: [],
  expectedSalary: { amount: null, currency: "", period: "" },
};

export interface CandidateLink {
  label: string;
  value: string;
}

export interface CvTailoringPersonal {
  name: string;
  professionalTitle: string;
  links: CandidateLink[];
}

export interface CvTailoringInput {
  personal: CvTailoringPersonal;
  summary: string;
  experience: CandidateExperience[];
  education: CandidateEducation[];
  techStack: string[];
  languages: CandidateLanguage[];
}

export const EMPTY_CV_TAILORING_INPUT: CvTailoringInput = {
  personal: { name: "", professionalTitle: "", links: [] },
  summary: "",
  experience: [],
  education: [],
  techStack: [],
  languages: [],
};

export interface VacancyDetails {
  company: string;
  role: string;
  seniority: string;
  workMode: string;
  location: string;
  techStack: string[];
  requiredLanguages: string[];
  salary: string;
}

export const EMPTY_VACANCY: VacancyDetails = {
  company: "",
  role: "",
  seniority: "",
  workMode: "",
  location: "",
  techStack: [],
  requiredLanguages: [],
  salary: "",
};

export interface VacancyRecord {
  id: string;
  createdAt: string;
  notes: string;
  vacancy: VacancyDetails;
  tailoredCvMarkdown: string | null;
  hasPdf: boolean;
}
