import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Candidate, VacancyRecord, VacancySummary } from "@cvhelper/shared";
import { EMPTY_CANDIDATE } from "@cvhelper/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const CANDIDATE_FILE = path.join(DATA_DIR, "candidate.json");
const VACANCIES_DIR = path.join(DATA_DIR, "vacancies");

async function ensureDataDir(): Promise<void> {
  await mkdir(VACANCIES_DIR, { recursive: true });
}

export async function readCandidate(): Promise<Candidate> {
  await ensureDataDir();
  try {
    const raw = await readFile(CANDIDATE_FILE, "utf-8");
    return JSON.parse(raw) as Candidate;
  } catch {
    return EMPTY_CANDIDATE;
  }
}

export async function writeCandidate(candidate: Candidate): Promise<void> {
  await ensureDataDir();
  await writeFile(CANDIDATE_FILE, JSON.stringify(candidate, null, 2), "utf-8");
}

const COMBINING_MARKS = /[̀-ͯ]/g;

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "vacancy";
}

export function makeVacancyId(company: string, role: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${date}-${slugify(company)}-${slugify(role)}`;
}

function vacancyDir(id: string): string {
  return path.join(VACANCIES_DIR, id);
}

export async function saveVacancyRecord(record: VacancyRecord): Promise<void> {
  const dir = vacancyDir(record.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "notes.md"), record.notes, "utf-8");
  await writeFile(path.join(dir, "vacancy.json"), JSON.stringify(record.vacancy, null, 2), "utf-8");
  await writeFile(
    path.join(dir, "meta.json"),
    JSON.stringify(
      {
        id: record.id,
        createdAt: record.createdAt,
        hasPdf: record.hasPdf,
      },
      null,
      2,
    ),
    "utf-8",
  );
  if (record.tailoredCvMarkdown) {
    await writeFile(path.join(dir, "tailored-cv.md"), record.tailoredCvMarkdown, "utf-8");
  }
}

export async function readVacancyRecord(id: string): Promise<VacancyRecord | null> {
  const dir = vacancyDir(id);
  try {
    const [notes, vacancyJson, metaJson] = await Promise.all([
      readFile(path.join(dir, "notes.md"), "utf-8"),
      readFile(path.join(dir, "vacancy.json"), "utf-8"),
      readFile(path.join(dir, "meta.json"), "utf-8"),
    ]);
    const meta = JSON.parse(metaJson) as { createdAt: string; hasPdf: boolean };
    let tailoredCvMarkdown: string | null = null;
    try {
      tailoredCvMarkdown = await readFile(path.join(dir, "tailored-cv.md"), "utf-8");
    } catch {
      tailoredCvMarkdown = null;
    }
    return {
      id,
      createdAt: meta.createdAt,
      notes,
      vacancy: JSON.parse(vacancyJson),
      tailoredCvMarkdown,
      hasPdf: meta.hasPdf,
    };
  } catch {
    return null;
  }
}

export async function updateTailoredCv(id: string, markdown: string): Promise<void> {
  const dir = vacancyDir(id);
  await writeFile(path.join(dir, "tailored-cv.md"), markdown, "utf-8");
}

export async function markPdfExported(id: string): Promise<void> {
  const dir = vacancyDir(id);
  const metaPath = path.join(dir, "meta.json");
  const meta = JSON.parse(await readFile(metaPath, "utf-8"));
  meta.hasPdf = true;
  await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");
}

export function vacancyPdfPath(id: string): string {
  return path.join(vacancyDir(id), "tailored-cv.pdf");
}

export async function listVacancies(): Promise<VacancySummary[]> {
  await ensureDataDir();
  const entries = await readdir(VACANCIES_DIR, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const summaries: VacancySummary[] = [];
  for (const id of dirs) {
    const record = await readVacancyRecord(id);
    if (record) {
      summaries.push({
        id: record.id,
        company: record.vacancy.company,
        role: record.vacancy.role,
        createdAt: record.createdAt,
      });
    }
  }
  return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
