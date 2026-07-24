# CVHelper

A local, personal tool to tailor your CV/resume to specific job vacancies. Everything runs on your machine and is local/deterministic, with one narrow exception: automatic job posting analysis calls the Gemini API (see Prerequisites).

## What it does

- **Review + Tailoring**:
  - Paste a job posting and detect which known technologies it mentions (local catalog matching, no AI), plus auto-detect company, role, seniority, work mode, location, and salary (calls the Gemini API, requires `GEMINI_API_KEY`).
  - Add required languages manually and edit the job posting details form.
  - **CV Tailoring panel**: a form prefilled from your Candidate profile (local copy, doesn't overwrite your saved profile) that generates a LaTeX (Harvard-style) resume and downloads it as a **compiled PDF**.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm.
- A local **LaTeX distribution** with `pdflatex` on your `PATH` — required only for the "CV Tailoring" panel's PDF download. Not installed via npm.
- A **Gemini API key** — optional, only required for the "Read" button's automatic job posting analysis. Get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and set it as `GEMINI_API_KEY` in `apps/api/.env`. Without it, that one autofill fails gracefully; tech stack detection and everything else keeps working.

### Installing LaTeX (macOS) — exact commands, run in order

1. Install BasicTeX (lightweight, ~100 MB) via Homebrew instead of full MacTeX (~5 GB). This step asks for your macOS password (the installer runs as `sudo` internally):

   ```bash
   brew install --cask basictex
   ```

2. Load the updated `PATH` into your current terminal session (or open a new terminal window instead):

   ```bash
   eval "$(/usr/libexec/path_helper)"
   ```

3. Verify `pdflatex` is now found:

   ```bash
   which pdflatex
   # -> /Library/TeX/texbin/pdflatex
   ```

4. BasicTeX ships a minimal package set and is missing two packages this project's LaTeX template needs. Install them with `tlmgr` (asks for your macOS password again):

   ```bash
   sudo tlmgr update --self
   sudo tlmgr install enumitem titlesec
   ```

5. Verify both packages are now found:

   ```bash
   kpsewhich enumitem.sty
   kpsewhich titlesec.sty
   # both should print a path; empty output means it's still missing
   ```

6. If `npm run dev:api` was already running before you did the steps above, **restart it** — the running process won't pick up the updated `PATH` on its own:

   ```bash
   # Ctrl+C in the terminal running dev:api, then:
   npm run dev:api
   ```

> Symptom → cause: `pdflatex was not found on this machine` means step 1–3 weren't done (or the API wasn't restarted after). `File 'enumitem.sty'/'titlesec.sty' not found` during compilation means step 4–5 weren't done (or the API wasn't restarted after).

## Installation

```bash
# clone and enter the repo, then install all workspace dependencies
npm install

# copy the API environment file (GEMINI_API_KEY is optional, see Prerequisites)
cp apps/api/.env.example apps/api/.env
```

## Running locally

Two dev servers, in separate terminals, from the repo root:

```bash
# terminal 1 — API (Hono) on http://localhost:3001
npm run dev:api

# terminal 2 — web app (Vite) on http://localhost:5173
npm run dev:web
```

Open `http://localhost:5173` in your browser.

## Other commands

```bash
# build everything (shared types -> tech-fit -> api -> web)
npm run build

# typecheck everything
npm run typecheck

# lint (web + api)
npm run lint

# tech-fit package: local job/tech-stack matching algorithm (no AI)
npm run test --workspace=packages/tech-fit
npm run example --workspace=packages/tech-fit
```

## Project structure

```
apps/
  api/      Hono backend (candidate/vacancy/tailor/pdf/latex/extraction routes)
  web/      React + Vite frontend
packages/
  shared/           Shared TypeScript types (Candidate, VacancyDetails, ...)
  tech-fit/         Local technology-detection/fit-matching algorithm (no AI)
  vacancy-extractor/ Full job posting analysis (company/role/seniority/location/workMode/employmentType/salary/technologies/...) via the Gemini API — the app's one AI call
```

See [CLAUDE.md](CLAUDE.md) for a deeper architecture walkthrough.
