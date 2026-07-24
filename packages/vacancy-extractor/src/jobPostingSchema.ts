import { SchemaType, type Schema } from "@google/generative-ai";
import { EMPLOYMENT_TYPES, SENIORITY_LEVELS, WORK_MODES } from "./types.js";

const stringArray: Schema = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } };

export const jobPostingSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    company: { type: SchemaType.STRING, nullable: true },
    role: { type: SchemaType.STRING, nullable: true },
    seniority: { type: SchemaType.STRING, format: "enum", enum: [...SENIORITY_LEVELS], nullable: true },
    location: { ...stringArray, nullable: true },
    workMode: { type: SchemaType.STRING, format: "enum", enum: [...WORK_MODES], nullable: true },
    employmentType: { type: SchemaType.STRING, format: "enum", enum: [...EMPLOYMENT_TYPES], nullable: true },
    salary: {
      type: SchemaType.OBJECT,
      nullable: true,
      properties: {
        currency: { type: SchemaType.STRING },
        min: { type: SchemaType.NUMBER },
        max: { type: SchemaType.NUMBER },
        period: { type: SchemaType.STRING },
      },
      required: ["currency", "min", "max", "period"],
    },
    requiredExperience: { type: SchemaType.NUMBER, nullable: true },
    technologies: stringArray,
    requiredLanguages: stringArray,
    responsibilities: stringArray,
    requirements: stringArray,
    preferredQualifications: stringArray,
  },
  required: [
    "company",
    "role",
    "seniority",
    "location",
    "workMode",
    "employmentType",
    "salary",
    "requiredExperience",
    "technologies",
    "requiredLanguages",
    "responsibilities",
    "requirements",
    "preferredQualifications",
  ],
};
