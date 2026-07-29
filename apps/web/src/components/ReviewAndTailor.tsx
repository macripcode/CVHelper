import { useState } from 'react'
import type { VacancyDetails } from '@cvhelper/shared'
import { EMPTY_VACANCY } from '@cvhelper/shared'
import { api } from '../api'

interface ReviewAndTailorProps {
  onUseTechStack?: (techStack: string[]) => void
  onUseSummary?: (summary: string) => void
}

export function ReviewAndTailor({ onUseTechStack, onUseSummary }: ReviewAndTailorProps) {
  const [form, setForm] = useState<VacancyDetails>(EMPTY_VACANCY)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState<'idle' | 'reading'>('idle')
  const [professionalProfileSummary, setProfessionalProfileSummary] = useState<string | null>(null)
  const [detectedTechnologies, setDetectedTechnologies] = useState<string[]>([])

  function updateField<K extends keyof VacancyDetails>(key: K, value: VacancyDetails[K]) {
    setForm({ ...form, [key]: value })
  }

  function removeLanguage(index: number) {
    setForm({ ...form, requiredLanguages: form.requiredLanguages.filter((_, i) => i !== index) })
  }

  async function readTechnologiesFromText() {
    setLoading('reading')
    setProfessionalProfileSummary(null)
    setDetectedTechnologies([])
    try {
      const analysis = await api.extractJobPosting(notes)
      setDetectedTechnologies(analysis.technologies)
      setForm((prev) => {
        const next = { ...prev }
        if (analysis.company && !prev.company.trim()) next.company = analysis.company
        if (analysis.role && !prev.role.trim()) next.role = analysis.role
        if (analysis.seniority && !prev.seniority.trim()) next.seniority = analysis.seniority
        if (analysis.workMode && !prev.workMode.trim()) next.workMode = analysis.workMode
        if (analysis.location && !prev.location.trim()) next.location = analysis.location.join(', ')
        if (analysis.salary && !prev.salary.trim()) {
          const { currency, min, max, period } = analysis.salary
          next.salary = `${currency} ${min}-${max}/${period}`
        }
        if (analysis.requiredLanguages.length > 0) {
          const merged = [...prev.requiredLanguages]
          for (const language of analysis.requiredLanguages) {
            if (!merged.includes(language)) merged.push(language)
          }
          next.requiredLanguages = merged
        }
        return next
      })
      setProfessionalProfileSummary(analysis.professionalProfileSummary)
    } catch {
      // Job posting analysis failure is non-blocking — every field here stays manually editable.
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
          className="job-posting-textarea"
          rows={10}
          placeholder="Paste the full job posting text here"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="button"
          className="read-button"
          onClick={readTechnologiesFromText}
          disabled={!notes.trim() || loading === 'reading'}
        >
          {loading === 'reading' ? 'Reading...' : 'Read'}
        </button>
      </fieldset>
      <fieldset>
        <legend>Job posting details</legend>
        <div className="field-row">
          <span className="field-label">Company</span>
          <input value={form.company} onChange={(e) => updateField('company', e.target.value)} />
        </div>
        <div className="field-row">
          <span className="field-label">Role</span>
          <input value={form.role} onChange={(e) => updateField('role', e.target.value)} />
        </div>
        <fieldset className="tech-suggestions">
          <legend>All detected technologies</legend>
          {detectedTechnologies.length > 0 ? (
            <div className="tag-list">
              {detectedTechnologies.map((tech, i) => (
                <span className="tag" key={i}>{tech}</span>
              ))}
            </div>
          ) : (
            <p className="hint">Paste a job posting and click Read to detect technologies.</p>
          )}
          <button
            type="button"
            className="centered-button"
            disabled={detectedTechnologies.length === 0}
            onClick={() => onUseTechStack?.(detectedTechnologies)}
          >
            Use this Tech Stack
          </button>
        </fieldset>
        <fieldset className="tech-suggestions">
          <legend>Professional summary</legend>
          {professionalProfileSummary ? (
            <p className="professional-profile-summary">{professionalProfileSummary}</p>
          ) : (
            <p className="hint">Paste a job posting and click Read to generate this.</p>
          )}
          <button
            type="button"
            className="centered-button"
            disabled={!professionalProfileSummary}
            onClick={() => professionalProfileSummary && onUseSummary?.(professionalProfileSummary)}
          >
            Use this summary profile
          </button>
        </fieldset>
        <div className="field-row">
          <span className="field-label">Seniority</span>
          <input value={form.seniority} onChange={(e) => updateField('seniority', e.target.value)} />
        </div>
        <div className="field-row">
          <span className="field-label">Work mode</span>
          <input value={form.workMode} onChange={(e) => updateField('workMode', e.target.value)} />
        </div>
        <div className="field-row">
          <span className="field-label">Location</span>
          <input value={form.location} onChange={(e) => updateField('location', e.target.value)} />
        </div>
        <div className="field-row">
          <span className="field-label">Salary</span>
          <input value={form.salary} onChange={(e) => updateField('salary', e.target.value)} />
        </div>
        <span className="field-label">Languages required</span>
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
      </fieldset>
    </div>
  )
}
