import type { Candidate, CvTailoringInput, VacancyDetails, VacancyRecord } from '@cvhelper/shared'

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

  createVacancy: (payload: { vacancy: VacancyDetails; notes?: string }) =>
    request<VacancyRecord>('/api/vacancy', { method: 'POST', body: JSON.stringify(payload) }),
  getVacancy: (id: string) => request<VacancyRecord>(`/api/vacancy/${id}`),

  tailorCv: (vacancyId: string) =>
    request<{ vacancyId: string; tailoredCvMarkdown: string }>('/api/tailor', {
      method: 'POST',
      body: JSON.stringify({ vacancyId }),
    }),
  saveTailoredCv: (vacancyId: string, markdown: string) =>
    request<{ vacancyId: string; tailoredCvMarkdown: string }>('/api/tailor', {
      method: 'PUT',
      body: JSON.stringify({ vacancyId, markdown }),
    }),

  exportPdf: (vacancyId: string) =>
    request<{ vacancyId: string; downloadUrl: string }>('/api/pdf', {
      method: 'POST',
      body: JSON.stringify({ vacancyId }),
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
