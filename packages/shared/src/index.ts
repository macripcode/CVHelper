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

export interface CandidateExperience {
  company: string;
  role: string;
  project: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
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

export interface VacancyDetails {
  company: string;
  role: string;
  seniority: string;
  workMode: string;
  location: string;
  requiredExperience: string;
  techStack: string[];
  salary: string;
  responsibilities: string[];
  requirements: string[];
}

export const EMPTY_VACANCY: VacancyDetails = {
  company: "",
  role: "",
  seniority: "",
  workMode: "",
  location: "",
  requiredExperience: "",
  techStack: [],
  salary: "",
  responsibilities: [],
  requirements: [],
};

export interface VacancySummary {
  id: string;
  company: string;
  role: string;
  createdAt: string;
}

export interface VacancyRecord {
  id: string;
  createdAt: string;
  notes: string;
  vacancy: VacancyDetails;
  tailoredCvMarkdown: string | null;
  hasPdf: boolean;
}
