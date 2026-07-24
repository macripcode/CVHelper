# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CVHelper is a local personal tool that helps the user tailor their CV/resume to a specific job vacancy. It is fully manual/deterministic — **no LLM or external AI service is called anywhere in the app** (the user explicitly opted out of both a paid Anthropic API and a free-tier Gemini API after trying both). Long-term vision has 5 modules: **Candidate** (structured profile), **Application** (auto-fill/submit applications, future), **Job Search** (LinkedIn/Indeed search, future), **Vacancy Review** (structured job posting details), **CV Tailoring** (generate a resume draft from the candidate profile + manually edit it to match the vacancy, then export to PDF). Only Candidate, Vacancy Review, and Tailoring are implemented so far — Job Search and automated Application are intentionally out of scope until later.

The entire product — data model field names, API/UI text — is in English, regardless of what language the user writes to Claude Code in. Do not reintroduce an AI/LLM dependency (Anthropic, Gemini, or otherwise) unless the user explicitly asks for it again.

## Commands

This is an npm workspaces monorepo (`apps/*`, `packages/*`). Run workspace scripts with `--workspace=<path>` from the repo root, or `cd` into the workspace.

```bash
# install (run once, or after adding deps)
npm install

# dev servers (run in separate terminals)
npm run dev:api          # Hono API on :3001 (tsx watch)
npm run dev:web          # Vite dev server on :5173, proxies /api -> :3001

# build (shared must build before api/web, `npm run build` does this in order)
npm run build
npm run build:shared
npm run build:api
npm run build:web

# typecheck / lint
npm run typecheck        # runs in both apps/web and apps/api
npm run lint             # oxlint (web) + tsc-based checks (api)
npm run typecheck --workspace=apps/api   # single workspace
```

`packages/tech-fit` has a unit test suite (Node's built-in test runner, no extra framework): `npm run test --workspace=packages/tech-fit`. No other workspace has tests yet.

```bash
# tech-fit package
npm run build --workspace=packages/tech-fit
npm run typecheck --workspace=packages/tech-fit
npm run test --workspace=packages/tech-fit      # node --import tsx --test ...
npm run example --workspace=packages/tech-fit   # runs examples/usage.ts via tsx
```

`apps/api` only needs a `.env` (copy from `apps/api/.env.example`) with `PORT` and `WEB_ORIGIN` — no API key is required since there's no AI integration.

**LaTeX CV export requires a local `pdflatex`** (not managed via npm): install a TeX distribution and make sure `pdflatex` is on `PATH`. Without it, `POST /api/latex/pdf` fails with a clear "pdflatex was not found" error. Prefer **BasicTeX** (`brew install --cask basictex`, ~100 MB) over full MacTeX (~5 GB) — the template only needs `pdflatex` plus `geometry`, `hyperref`, `enumitem`, `titlesec`, `tabularx`, `xcolor`, and `setspace`, all included in BasicTeX.

## Architecture

**Monorepo layout**: `packages/shared` holds TypeScript interfaces used by both apps (`Candidate`, `VacancyDetails`, `VacancyRecord`, `VacancySummary`, `HealthResponse`). It must be built (`npm run build:shared`) before `apps/api`/`apps/web` typecheck against its `dist/` output — there's no live-reload link between shared source and its dependents.

**Data model — Candidate is structured, not free text**: the CV is not stored as a Markdown blob. `Candidate` (`packages/shared/src/index.ts`) is a structured JSON object (personal info, experience, education, tech stack, soft skills, languages, expected salary) persisted at `apps/api/data/candidate.json`. Each `CandidateExperience` entry has an optional `project` field for representing sub-projects under a single employer (e.g. multiple client projects under one contracting company).

**Vacancy Review is a manual form, not extraction**: `VacancyDetails` (company, role, seniority, workMode, location, requiredExperience, techStack, salary, responsibilities, requirements) is filled in directly by the user in `ReviewAndTailor.tsx` — there is no scraping or parsing of a job posting URL/text. An optional free-text `notes` field lets the user paste the original posting for their own reference; it is stored but never parsed.

**Tailoring is template-based, not generative**: `apps/api/src/services/cvTemplate.ts` (`candidateToMarkdown`) deterministically renders the candidate's structured profile into a resume Markdown draft — same output every time for the same profile, no model call involved. The user is expected to manually edit that draft (reorder, trim, re-emphasize) in the browser to match the specific vacancy before exporting. `POST /api/tailor` regenerates the draft from scratch (overwriting unsaved manual edits); `PUT /api/tailor` persists the user's edited Markdown.

**Per-vacancy storage**: each saved vacancy lives in `apps/api/data/vacancies/<date>-<company>-<role>/` (id generated by `makeVacancyId` in `apps/api/src/services/storage.ts`), containing `notes.md`, `vacancy.json` (the `VacancyDetails` form data), `tailored-cv.md`, `tailored-cv.pdf`, and `meta.json`. `apps/api/data/` is gitignored — it's the user's real personal content, not fixtures.

**PDF pipeline**: `apps/api/src/services/pdfRenderer.ts` renders the tailored Markdown through `markdown-it` into an HTML document with inline print CSS, then uses Puppeteer (bundled Chromium, headless) to print it to a PDF buffer. There is no persistent browser instance — a new Puppeteer browser is launched and closed per export.

**Frontend has no router**: `apps/web/src/App.tsx` is a single page with local `useState` tab switching (`candidate` / `vacancy` / `history`) rendering `CandidateForm`, `ReviewAndTailor`, `HistoryList` from `apps/web/src/components/`. All backend calls go through the thin wrapper in `apps/web/src/api.ts`; Vite's dev server proxies `/api/*` to the Hono server on :3001 (`apps/web/vite.config.ts`), so components fetch relative paths like `/api/candidate` regardless of environment.

**Backend is a single Hono app**: `apps/api/src/index.ts` mounts one router per module under `routes/` (`candidate.ts`, `vacancy.ts`, `tailor.ts`, `pdf.ts`, `history.ts`, `latex.ts`), each backed by services in `services/` (`storage.ts` for all file I/O, `cvTemplate.ts`, `pdfRenderer.ts`, `latexTemplate.ts`, `latexCompiler.ts`). CORS is restricted to `WEB_ORIGIN` (default `http://localhost:5173`).

**LaTeX CV export is a second, independent tailoring path**, separate from the Markdown/Puppeteer tailoring flow above. `apps/web/src/components/CvLatexPanel.tsx` renders next to `ReviewAndTailor` (two-column layout in `App.tsx`'s "vacancy" tab, `.two-column` in `App.css`). It prefills a **local-only** `Candidate` copy from `GET /api/candidate` — edits here never write back to `candidate.json`, by design (the user explicitly wants to tweak this copy per-download without touching their saved profile). "Download PDF" posts that local `Candidate` to `POST /api/latex/pdf`, which:
1. Renders it to LaTeX via `candidateToLatex()` (`apps/api/src/services/latexTemplate.ts`) — reproduces the user's own Harvard-style template (`\name`/`\role`/`\contact` header, Summary, Tech Stack, Professional Experience, Education, Languages). Every dynamic string goes through `escapeLatex()` to survive LaTeX special characters. `experience` entries are grouped by `company` (order-preserving); a group renders as nested `\item \textbf{Project}` sub-lists when it has more than one entry or any `project` name (matching multiple contracts/projects under one employer), or as a flat achievement list otherwise. There's no modeled "work mode / employment type" field, so that part of the original template's header line is intentionally not reproduced — `description` (if present) is rendered as a line under the company heading instead of guessing/parsing it out.
2. Compiles that LaTeX to a PDF via `compileLatexToPdf()` (`apps/api/src/services/latexCompiler.ts`), which shells out to `pdflatex` in a temp directory and cleans up afterward — this is the one part of the stack with a non-npm system dependency (see the `pdflatex` prerequisite above).
3. Streams the PDF back directly (no persistence to `data/` — this is a point-in-time download, not a saved record like the per-vacancy PDF flow).

**`packages/tech-fit` — local, dependency-free tech-matching algorithm**: given free-form job posting text, a list of technologies the candidate knows, and the local catalog in `src/data/tech-catalog.ts` (exported as `techCatalog`), `analyzeJobFit()` (`src/utils/analyze-job-fit.ts`) reports which of the job's required technologies the candidate has and is missing, plus a fit percentage. No LLM, network call, or embeddings are involved — matching is pure string/regex logic. Has its own tests (`npm run test --workspace=packages/tech-fit`) and a runnable example (`examples/usage.ts`).

`apps/web` depends on `@cvhelper/tech-fit` directly (browser-safe, no Node built-ins) and imports its compiled `dist/` output the same way it does `@cvhelper/shared` — rebuild it (`npm run build --workspace=packages/tech-fit`) after editing its source so the frontend picks up changes. In `ReviewAndTailor.tsx`, the "Job posting text" textarea + "Read" button calls `extractJobTechnologies()` directly in the browser and overwrites the `techStack` field of the vacancy form with the detected list — `analyzeJobFit()` itself (the fit-percentage comparison against the candidate's known stack) is not surfaced in the UI yet.

The tricky part of `extractJobTechnologies()` (`src/utils/extract-job-technologies.ts`) is avoiding false positives for short/substring-prone tech names (`Go` inside "Google", `R` inside "Rust", `Java` inside "JavaScript", `SQL` inside "SQL Server"). It solves this two ways: (1) every alias match requires non-alphanumeric boundaries via lookaround regex rather than `\b`, so it also works for symbol-heavy aliases like `C++`, `C#`, `.NET`; (2) all aliases across the whole pool are tried longest-first against the raw text, and matched character ranges are marked "consumed" so a shorter alias can never claim text already attributed to a longer alias it's a substring of — while still matching that shorter tech correctly if it appears independently elsewhere in the same text. When extending `techCatalog`, never give two different technologies an identical alias string (ambiguous exact-match lookup in `normalizeTechnology`).
