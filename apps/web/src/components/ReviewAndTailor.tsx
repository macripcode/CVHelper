import { useState } from 'react'
import type { VacancyDetails, VacancyRecord } from '@cvhelper/shared'
import { EMPTY_VACANCY } from '@cvhelper/shared'
import { extractJobTechnologies, techCatalog } from '@cvhelper/tech-fit'
import { api } from '../api'

export function ReviewAndTailor({ onProcessed }: { onProcessed?: () => void }) {
  const [form, setForm] = useState<VacancyDetails>(EMPTY_VACANCY)
  const [notes, setNotes] = useState('')
  const [vacancy, setVacancy] = useState<VacancyRecord | null>(null)
  const [tailoredCv, setTailoredCv] = useState('')
  const [loading, setLoading] = useState<'idle' | 'saving' | 'tailoring' | 'exporting'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [detectionHint, setDetectionHint] = useState<string | null>(null)

  function updateField<K extends keyof VacancyDetails>(key: K, value: VacancyDetails[K]) {
    setForm({ ...form, [key]: value })
  }

  function updateListField(key: 'techStack' | 'responsibilities' | 'requirements', value: string, separator: '\n' | ',') {
    setForm({
      ...form,
      [key]: value
        .split(separator)
        .map((v) => v.trim())
        .filter(Boolean),
    })
  }

  function readTechnologiesFromText() {
    const detected = extractJobTechnologies(notes, techCatalog)
    setForm({ ...form, techStack: detected })
    setDetectionHint(
      detected.length > 0
        ? `Detected ${detected.length} technolog${detected.length === 1 ? 'y' : 'ies'}: ${detected.join(', ')}`
        : 'No known technologies were detected in this text.',
    )
  }

  async function saveVacancy() {
    setError(null)
    setLoading('saving')
    try {
      const record = await api.createVacancy({ vacancy: form, notes })
      setVacancy(record)
      setTailoredCv('')
      setDownloadUrl(null)
      onProcessed?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving the job posting')
    } finally {
      setLoading('idle')
    }
  }

  async function runTailoring() {
    if (!vacancy) return
    setError(null)
    setLoading('tailoring')
    try {
      const result = await api.tailorCv(vacancy.id)
      setTailoredCv(result.tailoredCvMarkdown)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating the resume draft')
    } finally {
      setLoading('idle')
    }
  }

  async function exportPdf() {
    if (!vacancy) return
    setError(null)
    setLoading('exporting')
    try {
      await api.saveTailoredCv(vacancy.id, tailoredCv)
      const result = await api.exportPdf(vacancy.id)
      setDownloadUrl(result.downloadUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error exporting the PDF')
    } finally {
      setLoading('idle')
    }
  }

  return (
    <div className="panel">
      <h2>Job posting review</h2>
      <fieldset>
        <legend>Job posting text</legend>
        <textarea
          rows={10}
          placeholder="Paste the full job posting text here"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="button" onClick={readTechnologiesFromText} disabled={!notes.trim()}>
          Read
        </button>
        {detectionHint && <p className="hint">{detectionHint}</p>}
      </fieldset>
      <fieldset>
        <legend>Job posting details</legend>
        <div className="grid">
          <input placeholder="Company" value={form.company} onChange={(e) => updateField('company', e.target.value)} />
          <input placeholder="Role" value={form.role} onChange={(e) => updateField('role', e.target.value)} />
          <input placeholder="Seniority" value={form.seniority} onChange={(e) => updateField('seniority', e.target.value)} />
          <input placeholder="Work mode" value={form.workMode} onChange={(e) => updateField('workMode', e.target.value)} />
          <input placeholder="Location" value={form.location} onChange={(e) => updateField('location', e.target.value)} />
          <input placeholder="Salary" value={form.salary} onChange={(e) => updateField('salary', e.target.value)} />
        </div>
        <textarea
          rows={2}
          placeholder="Required experience"
          value={form.requiredExperience}
          onChange={(e) => updateField('requiredExperience', e.target.value)}
        />
        <input
          placeholder="Tech stack (comma-separated)"
          value={form.techStack.join(', ')}
          onChange={(e) => updateListField('techStack', e.target.value, ',')}
        />
        <textarea
          rows={2}
          placeholder="Responsibilities (one per line)"
          value={form.responsibilities.join('\n')}
          onChange={(e) => updateListField('responsibilities', e.target.value, '\n')}
        />
        <textarea
          rows={2}
          placeholder="Requirements (one per line)"
          value={form.requirements.join('\n')}
          onChange={(e) => updateListField('requirements', e.target.value, '\n')}
        />
      </fieldset>
      <button type="button" onClick={saveVacancy} disabled={loading === 'saving' || (!form.company.trim() && !form.role.trim())}>
        {loading === 'saving' ? 'Saving...' : 'Save job posting'}
      </button>

      {error && <p className="hint error">{error}</p>}

      {vacancy && (
        <div className="card">
          <h3>{vacancy.vacancy.role || 'Role not specified'} — {vacancy.vacancy.company || 'Company not specified'}</h3>
          <button type="button" onClick={runTailoring} disabled={loading === 'tailoring'}>
            {loading === 'tailoring' ? 'Creating draft...' : 'Create resume draft from my profile'}
          </button>
        </div>
      )}

      {tailoredCv && (
        <fieldset>
          <legend>Resume draft (edit it to match this job posting)</legend>
          <textarea rows={16} value={tailoredCv} onChange={(e) => setTailoredCv(e.target.value)} />
          <button type="button" onClick={exportPdf} disabled={loading === 'exporting'}>
            {loading === 'exporting' ? 'Exporting...' : 'Export to PDF'}
          </button>
          {downloadUrl && (
            <a className="hint" href={downloadUrl} target="_blank" rel="noreferrer">
              Download PDF
            </a>
          )}
        </fieldset>
      )}
    </div>
  )
}
