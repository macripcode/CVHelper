# CVHelper

A local, personal tool to tailor your CV/resume to specific job vacancies. Everything runs on your machine — there is **no AI/LLM integration and no external API calls**; tech-matching and CV generation are done with local, deterministic logic.

## What it does

- **Candidate**: keep a structured profile (personal info, experience, education, tech stack, languages, expected salary).
- **Review + Tailoring**:
  - Paste a job posting and detect which known technologies it mentions (local catalog matching, no AI).
  - Fill in job posting details and generate a resume draft from your Candidate profile to manually tailor per vacancy, exported as PDF.
  - **CV Tailoring panel**: a form prefilled from your Candidate profile (local copy, doesn't overwrite your saved profile) that generates a LaTeX (Harvard-style) resume and downloads it as a **compiled PDF**.
- **History**: browse past job postings you've processed.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm.
- A local **LaTeX distribution** with `pdflatex` on your `PATH` — required only for the "CV Tailoring" panel's PDF download. Not installed via npm.

### Installing LaTeX (macOS)

Install BasicTeX (lightweight, ~100 MB) via Homebrew instead of full MacTeX (~5 GB):

```bash
brew install --cask basictex
```

Restart your terminal (or run `eval "$(/usr/libexec/path_helper)"`) so `pdflatex` is on your `PATH`, then verify:

```bash
which pdflatex
```

BasicTeX ships a minimal package set. This project's LaTeX template additionally needs `enumitem` and `titlesec`, which are **not** included by default — install them with:

```bash
sudo tlmgr update --self
sudo tlmgr install enumitem titlesec
```

> If you ever see `pdflatex was not found on this machine` after just installing BasicTeX, or a `File 'enumitem.sty'/'titlesec.sty' not found` compilation error, it means one of the two steps above wasn't done yet. After installing/updating LaTeX packages, **restart `npm run dev:api`** so the API process picks up the updated `PATH`.

## Installation

```bash
# clone and enter the repo, then install all workspace dependencies
npm install

# copy the API environment file (no API key needed — no AI integration)
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
  api/      Hono backend (candidate/vacancy/tailor/pdf/latex routes)
  web/      React + Vite frontend
packages/
  shared/   Shared TypeScript types (Candidate, VacancyDetails, ...)
  tech-fit/ Local technology-detection/fit-matching algorithm (no AI)
```

See [CLAUDE.md](CLAUDE.md) for a deeper architecture walkthrough.
