import { useState } from 'react'
import type { VacancyDetails } from '@cvhelper/shared'
import { EMPTY_VACANCY } from '@cvhelper/shared'
import { extractJobTechnologies, techCatalog } from '@cvhelper/tech-fit'
import { api } from '../api'

export function ReviewAndTailor() {
  const [form, setForm] = useState<VacancyDetails>(EMPTY_VACANCY)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState<'idle' | 'reading'>('idle')
  const [newLanguage, setNewLanguage] = useState('')

  function updateField<K extends keyof VacancyDetails>(key: K, value: VacancyDetails[K]) {
    setForm({ ...form, [key]: value })
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

    setLoading('reading')
    try {
      const analysis = await api.extractJobPosting(notes)
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
        return next
      })
    } catch {
      // Job posting analysis is a non-blocking convenience — tech stack detection above already succeeded.
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
        <div className="field-row">
          <span className="field-label">Company</span>
          <input value={form.company} onChange={(e) => updateField('company', e.target.value)} />
        </div>
        <div className="field-row">
          <span className="field-label">Role</span>
          <input value={form.role} onChange={(e) => updateField('role', e.target.value)} />
        </div>
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
        <div className="field-row">
          <span className="field-label">Languages required</span>
          <input
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addLanguage()
              }
            }}
          />
        </div>
      </fieldset>
    </div>
  )
}
