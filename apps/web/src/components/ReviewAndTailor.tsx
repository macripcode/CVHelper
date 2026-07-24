import { useState } from 'react'
import type { VacancyDetails, VacancyRecord } from '@cvhelper/shared'
import { EMPTY_VACANCY } from '@cvhelper/shared'
import { extractJobTechnologies, techCatalog } from '@cvhelper/tech-fit'
import { api } from '../api'

export function ReviewAndTailor() {
  const [form, setForm] = useState<VacancyDetails>(EMPTY_VACANCY)
  const [notes, setNotes] = useState('')
  const [vacancy, setVacancy] = useState<VacancyRecord | null>(null)
  const [tailoredCv, setTailoredCv] = useState('')
  const [loading, setLoading] = useState<'idle' | 'reading' | 'saving' | 'tailoring' | 'exporting'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [detectionHint, setDetectionHint] = useState<string | null>(null)
  const [newLanguage, setNewLanguage] = useState('')

  function updateField<K extends keyof VacancyDetails>(key: K, value: VacancyDetails[K]) {
    setForm({ ...form, [key]: value })
  }

  function updateListField(key: 'responsibilities' | 'requirements', value: string) {
    setForm({
      ...form,
      [key]: value
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean),
    })
  }

  function removeTech(index: number) {
    setForm({ ...form, techStack: form.techStack.filter((_, i) => i !== index) })
  }

  function addLanguage() {
    const value = newLanguage.trim()
    if (!value || form.requiredLanguages.includes(value)) {
      setNewLanguage('')
      return
    }
    setForm({ ...form, requiredLanguages: [...form.requiredLanguages, value] })
    setNewLanguage('')
  }

  function removeLanguage(index: number) {
    setForm({ ...form, requiredLanguages: form.requiredLanguages.filter((_, i) => i !== index) })
  }

  async function readTechnologiesFromText() {
    const detected = extractJobTechnologies(notes, techCatalog)
    setForm({ ...form, techStack: detected })
    setDetectionHint(
      detected.length > 0
        ? `Detected ${detected.length} technolog${detected.length === 1 ? 'y' : 'ies'}: ${detected.join(', ')}`
        : 'No known technologies were detected in this text.',
    )

    setLoading('reading')
    try {
      const details = await api.extractVacancyDetails(notes)
      setForm((prev) => {
        const next = { ...prev }
        for (const field of ['company', 'role', 'seniority', 'workMode', 'location', 'salary'] as const) {
          const value = details[field]
          if (value && !prev[field].trim()) next[field] = value
        }
        return next
      })
    } catch {
      // Vacancy-detail detection is a non-blocking convenience — tech stack detection above already succeeded.
    } finally {
      setLoading('idle')
    }
  }

  async function saveVacancy() {
    setError(null)
    setLoading('saving')
    try {
      const record = await api.createVacancy({ vacancy: form, notes })
      setVacancy(record)
      setTailoredCv('')
      setDownloadUrl(null)
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
        <button type="button" onClick={readTechnologiesFromText} disabled={!notes.trim() || loading === 'reading'}>
          {loading === 'reading' ? 'Reading...' : 'Read'}
        </button>
        {detectionHint && <p className="hint">{detectionHint}</p>}
      </fieldset>
      <fieldset>
        <legend>Job posting details</legend>
        {form.techStack.length > 0 && (
          <div className="tag-list">
            {form.techStack.map((tech, i) => (
              <span className="tag" key={i}>
                {tech}
                <button type="button" aria-label={`Remove ${tech}`} onClick={() => removeTech(i)}>×</button>
              </span>
            ))}
          </div>
        )}
        {form.requiredLanguages.length > 0 && (
          <div className="tag-list">
            {form.requiredLanguages.map((language, i) => (
              <span className="tag" key={i}>
                {language}
                <button type="button" aria-label={`Remove ${language}`} onClick={() => removeLanguage(i)}>×</button>
              </span>
            ))}
          </div>
        )}
        <input
          placeholder="Add required language and press Enter"
          value={newLanguage}
          onChange={(e) => setNewLanguage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addLanguage()
            }
          }}
        />
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
        <textarea
          rows={2}
          placeholder="Responsibilities (one per line)"
          value={form.responsibilities.join('\n')}
          onChange={(e) => updateListField('responsibilities', e.target.value)}
        />
        <textarea
          rows={2}
          placeholder="Requirements (one per line)"
          value={form.requirements.join('\n')}
          onChange={(e) => updateListField('requirements', e.target.value)}
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
