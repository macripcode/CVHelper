import type { Candidate, CvTailoringInput, VacancyDetails } from '@cvhelper/shared'

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

  extractVacancyDetails: (jobDescription: string) =>
    request<
      Partial<Pick<VacancyDetails, 'company' | 'role' | 'seniority' | 'workMode' | 'location' | 'salary'>> & {
        requiredLanguages?: string[]
      }
    >('/api/extraction/vacancy-details', { method: 'POST', body: JSON.stringify({ jobDescription }) }),

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
