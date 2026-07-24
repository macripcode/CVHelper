import type { Candidate, CvTailoringInput } from '@cvhelper/shared'
import type { JobPostingAnalysis } from '@cvhelper/vacancy-extractor'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  getCandidate: () => request<Candidate>('/api/candidate'),

  extractJobPosting: (jobDescription: string) =>
    request<JobPostingAnalysis>('/api/extraction/job-posting', {
      method: 'POST',
      body: JSON.stringify({ jobDescription }),
    }),

  downloadLatexPdf: async (resume: CvTailoringInput): Promise<Blob> => {
    const res = await fetch('/api/latex/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? `Error ${res.status}`)
    }
    return res.blob()
  },
}
