import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { DragEvent, ReactNode } from 'react'
import type { CvTailoringInput } from '@cvhelper/shared'
import { EMPTY_CV_TAILORING_INPUT } from '@cvhelper/shared'
import { api } from '../api'

function CollapsibleFieldset({ title, children }: { title: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <fieldset>
      <legend>
        <button
          type="button"
          className="collapse-toggle"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((value) => !value)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'none' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {title}
        </button>
      </legend>
      <div style={{ display: collapsed ? 'none' : 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </fieldset>
  )
}

function toTailoringInput(candidate: Awaited<ReturnType<typeof api.getCandidate>>): CvTailoringInput {
  const { personal } = candidate
  const links = [
    { label: 'Location', value: personal.location },
    { label: 'Email', value: personal.email },
    { label: 'Phone', value: personal.phone },
    { label: 'LinkedIn', value: personal.linkedin },
    { label: 'GitHub', value: personal.github },
    { label: 'Website', value: personal.website },
  ].filter((link) => link.value.trim() !== '')

  return {
    personal: { name: personal.name, professionalTitle: personal.professionalTitle, links },
    summary: candidate.summary,
    experience: candidate.experience,
    education: candidate.education,
    techStack: candidate.techStack,
    languages: candidate.languages,
  }
}

export interface CvLatexPanelHandle {
  replaceTechStack: (techStack: string[]) => void
  replaceSummary: (summary: string) => void
}

export const CvLatexPanel = forwardRef<CvLatexPanelHandle>(function CvLatexPanel(_props, ref) {
  const [resume, setResume] = useState<CvTailoringInput>(EMPTY_CV_TAILORING_INPUT)
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkValue, setNewLinkValue] = useState('')
  const [newTech, setNewTech] = useState('')
  const [draggedExperienceIndex, setDraggedExperienceIndex] = useState<number | null>(null)
  const [draggedEducationIndex, setDraggedEducationIndex] = useState<number | null>(null)
  const [draggedLanguageIndex, setDraggedLanguageIndex] = useState<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function loadCandidate() {
    setStatus('loading')
    api
      .getCandidate()
      .then((data) => {
        setResume(toTailoringInput(data))
        setStatus('idle')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(() => {
    loadCandidate()
  }, [])

  useImperativeHandle(ref, () => ({
    replaceTechStack: (techStack: string[]) => setResume((prev) => ({ ...prev, techStack })),
    replaceSummary: (summary: string) => setResume((prev) => ({ ...prev, summary })),
  }))

  function updatePersonal<K extends keyof CvTailoringInput['personal']>(key: K, value: CvTailoringInput['personal'][K]) {
    setResume({ ...resume, personal: { ...resume.personal, [key]: value } })
  }

  function updateLink(index: number, field: 'label' | 'value', value: string) {
    const links = [...resume.personal.links]
    links[index] = { ...links[index], [field]: value }
    updatePersonal('links', links)
  }

  function removeLink(index: number) {
    updatePersonal('links', resume.personal.links.filter((_, i) => i !== index))
  }

  function addLink() {
    if (!newLinkLabel.trim() && !newLinkValue.trim()) return
    updatePersonal('links', [...resume.personal.links, { label: newLinkLabel.trim(), value: newLinkValue.trim() }])
    setNewLinkLabel('')
    setNewLinkValue('')
  }

  function addTech() {
    const value = newTech.trim()
    if (!value || resume.techStack.includes(value)) {
      setNewTech('')
      return
    }
    setResume({ ...resume, techStack: [...resume.techStack, value] })
    setNewTech('')
  }

  function removeTech(index: number) {
    setResume({ ...resume, techStack: resume.techStack.filter((_, i) => i !== index) })
  }

  function addExperience() {
    setResume({
      ...resume,
      experience: [
        ...resume.experience,
        { company: '', role: '', project: '', startDate: '', endDate: '', description: '', achievements: [] },
      ],
    })
  }

  function updateExperience(index: number, field: keyof CvTailoringInput['experience'][number], value: string | string[]) {
    const experience = [...resume.experience]
    experience[index] = { ...experience[index], [field]: value }
    setResume({ ...resume, experience })
  }

  function removeExperience(index: number) {
    setResume({ ...resume, experience: resume.experience.filter((_, i) => i !== index) })
  }

  function handleExperienceDragStart(index: number) {
    setDraggedExperienceIndex(index)
  }

  function handleExperienceDragOver(e: DragEvent, index: number) {
    e.preventDefault()
    if (draggedExperienceIndex === null || draggedExperienceIndex === index) return
    const experience = [...resume.experience]
    const [moved] = experience.splice(draggedExperienceIndex, 1)
    experience.splice(index, 0, moved)
    setDraggedExperienceIndex(index)
    setResume({ ...resume, experience })
  }

  function handleExperienceDragEnd() {
    setDraggedExperienceIndex(null)
  }

  function addEducation() {
    setResume({
      ...resume,
      education: [...resume.education, { institution: '', degree: '', startDate: '', endDate: '' }],
    })
  }

  function updateEducation(index: number, field: keyof CvTailoringInput['education'][number], value: string) {
    const education = [...resume.education]
    education[index] = { ...education[index], [field]: value }
    setResume({ ...resume, education })
  }

  function removeEducation(index: number) {
    setResume({ ...resume, education: resume.education.filter((_, i) => i !== index) })
  }

  function handleEducationDragStart(index: number) {
    setDraggedEducationIndex(index)
  }

  function handleEducationDragOver(e: DragEvent, index: number) {
    e.preventDefault()
    if (draggedEducationIndex === null || draggedEducationIndex === index) return
    const education = [...resume.education]
    const [moved] = education.splice(draggedEducationIndex, 1)
    education.splice(index, 0, moved)
    setDraggedEducationIndex(index)
    setResume({ ...resume, education })
  }

  function handleEducationDragEnd() {
    setDraggedEducationIndex(null)
  }

  function addLanguage() {
    setResume({ ...resume, languages: [...resume.languages, { language: '', level: '' }] })
  }

  function updateLanguage(index: number, field: keyof CvTailoringInput['languages'][number], value: string) {
    const languages = [...resume.languages]
    languages[index] = { ...languages[index], [field]: value }
    setResume({ ...resume, languages })
  }

  function removeLanguage(index: number) {
    setResume({ ...resume, languages: resume.languages.filter((_, i) => i !== index) })
  }

  function handleLanguageDragStart(index: number) {
    setDraggedLanguageIndex(index)
  }

  function handleLanguageDragOver(e: DragEvent, index: number) {
    e.preventDefault()
    if (draggedLanguageIndex === null || draggedLanguageIndex === index) return
    const languages = [...resume.languages]
    const [moved] = languages.splice(draggedLanguageIndex, 1)
    languages.splice(index, 0, moved)
    setDraggedLanguageIndex(index)
    setResume({ ...resume, languages })
  }

  function handleLanguageDragEnd() {
    setDraggedLanguageIndex(null)
  }

  async function downloadPdf() {
    setError(null)
    setDownloading(true)
    try {
      const blob = await api.downloadLatexPdf(resume)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${(resume.personal.name || 'cv').trim().replace(/\s+/g, '-').toLowerCase()}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating the PDF')
    } finally {
      setDownloading(false)
    }
  }

  if (status === 'loading') return <p>Loading profile...</p>

  if (status === 'error') {
    return (
      <div className="panel">
        <h2>CV Tailoring</h2>
        <p className="hint error">Could not load your Candidate profile. Is the API server running?</p>
        <button type="button" onClick={loadCandidate}>Retry</button>
      </div>
    )
  }

  return (
    <div className="panel">
      <h2>CV Tailoring</h2>
      <p className="hint">
        Prefilled from your Candidate profile. Changes here are local to this download and won't update your saved profile.
      </p>

      <CollapsibleFieldset title="Header">
        <input
          className="cv-name-input"
          placeholder="Name"
          value={resume.personal.name}
          onChange={(e) => updatePersonal('name', e.target.value)}
        />
        <input
          className="cv-title-input"
          placeholder="Professional title"
          value={resume.personal.professionalTitle}
          onChange={(e) => updatePersonal('professionalTitle', e.target.value)}
        />
      </CollapsibleFieldset>

      <CollapsibleFieldset title="Links">
        {resume.personal.links.map((link, i) => (
          <div className="grid" key={i}>
            <input placeholder="Field name" value={link.label} onChange={(e) => updateLink(i, 'label', e.target.value)} />
            <input placeholder="Link" value={link.value} onChange={(e) => updateLink(i, 'value', e.target.value)} />
            <button type="button" className="icon-button" aria-label="Remove link" onClick={() => removeLink(i)}>×</button>
          </div>
        ))}
        <div className="grid">
          <input placeholder="Field name (e.g. Portfolio)" value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} />
          <input placeholder="Link" value={newLinkValue} onChange={(e) => setNewLinkValue(e.target.value)} />
          <button
            type="button"
            className="icon-button"
            aria-label={newLinkLabel.trim() || newLinkValue.trim() ? 'Save link' : 'Add link'}
            onClick={addLink}
          >
            {newLinkLabel.trim() || newLinkValue.trim() ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            ) : (
              '+'
            )}
          </button>
        </div>
      </CollapsibleFieldset>

      <CollapsibleFieldset title="Summary">
        <textarea rows={8} value={resume.summary} onChange={(e) => setResume({ ...resume, summary: e.target.value })} />
        <span className="char-count">{resume.summary.length} characters</span>
      </CollapsibleFieldset>

      <CollapsibleFieldset title="Tech stack">
        {resume.techStack.length > 0 && (
          <div className="tag-list">
            {resume.techStack.map((tech, i) => (
              <span className="tag" key={i}>
                {tech}
                <button type="button" aria-label={`Remove ${tech}`} onClick={() => removeTech(i)}>×</button>
              </span>
            ))}
          </div>
        )}
        <input
          placeholder="Add technology and press Enter"
          value={newTech}
          onChange={(e) => setNewTech(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTech()
            }
          }}
        />
      </CollapsibleFieldset>

      <CollapsibleFieldset title="Work experience">
        {resume.experience.map((exp, i) => (
          <div
            className={`card${draggedExperienceIndex === i ? ' dragging' : ''}`}
            key={i}
            onDragOver={(e) => handleExperienceDragOver(e, i)}
          >
            <div className="card-header">
              <button
                type="button"
                className="drag-handle"
                aria-label="Drag to reorder"
                draggable
                onDragStart={() => handleExperienceDragStart(i)}
                onDragEnd={handleExperienceDragEnd}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <line x1="4" y1="14" x2="20" y2="14" />
                  <line x1="4" y1="20" x2="20" y2="20" />
                </svg>
              </button>
              <button type="button" className="icon-button" aria-label="Remove experience" onClick={() => removeExperience(i)}>×</button>
            </div>
            <div className="grid">
              <input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} />
              <input placeholder="Role" value={exp.role} onChange={(e) => updateExperience(i, 'role', e.target.value)} />
            </div>
            <div className="date-row">
              <input placeholder="Start date" value={exp.startDate} onChange={(e) => updateExperience(i, 'startDate', e.target.value)} />
              <input placeholder="End date" value={exp.endDate} onChange={(e) => updateExperience(i, 'endDate', e.target.value)} />
            </div>
            <textarea
              rows={2}
              placeholder="Description"
              value={exp.description}
              onChange={(e) => updateExperience(i, 'description', e.target.value)}
            />
            <textarea
              rows={3}
              placeholder="Achievements (one per line)"
              value={exp.achievements.join('\n')}
              onChange={(e) => updateExperience(i, 'achievements', e.target.value.split('\n').filter(Boolean))}
            />
          </div>
        ))}
        <button type="button" className="icon-button" aria-label="Add experience" onClick={addExperience}>+</button>
      </CollapsibleFieldset>

      <CollapsibleFieldset title="Education">
        {resume.education.map((edu, i) => (
          <div
            className={`card${draggedEducationIndex === i ? ' dragging' : ''}`}
            key={i}
            onDragOver={(e) => handleEducationDragOver(e, i)}
          >
            <div className="card-header">
              <button
                type="button"
                className="drag-handle"
                aria-label="Drag to reorder"
                draggable
                onDragStart={() => handleEducationDragStart(i)}
                onDragEnd={handleEducationDragEnd}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <line x1="4" y1="14" x2="20" y2="14" />
                  <line x1="4" y1="20" x2="20" y2="20" />
                </svg>
              </button>
              <button type="button" className="icon-button" aria-label="Remove education" onClick={() => removeEducation(i)}>×</button>
            </div>
            <div className="grid">
              <input placeholder="Institution" value={edu.institution} onChange={(e) => updateEducation(i, 'institution', e.target.value)} />
              <input placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} />
            </div>
            <div className="date-row">
              <input placeholder="Start date" value={edu.startDate} onChange={(e) => updateEducation(i, 'startDate', e.target.value)} />
              <input placeholder="End date" value={edu.endDate} onChange={(e) => updateEducation(i, 'endDate', e.target.value)} />
            </div>
          </div>
        ))}
        <button type="button" className="icon-button" aria-label="Add education" onClick={addEducation}>+</button>
      </CollapsibleFieldset>

      <CollapsibleFieldset title="Languages">
        {resume.languages.map((lang, i) => (
          <div
            className={`card${draggedLanguageIndex === i ? ' dragging' : ''}`}
            key={i}
            onDragOver={(e) => handleLanguageDragOver(e, i)}
          >
            <div className="card-header">
              <button
                type="button"
                className="drag-handle"
                aria-label="Drag to reorder"
                draggable
                onDragStart={() => handleLanguageDragStart(i)}
                onDragEnd={handleLanguageDragEnd}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <line x1="4" y1="14" x2="20" y2="14" />
                  <line x1="4" y1="20" x2="20" y2="20" />
                </svg>
              </button>
              <button type="button" className="icon-button" aria-label="Remove language" onClick={() => removeLanguage(i)}>×</button>
            </div>
            <div className="grid">
              <input placeholder="Language" value={lang.language} onChange={(e) => updateLanguage(i, 'language', e.target.value)} />
              <input placeholder="Level" value={lang.level} onChange={(e) => updateLanguage(i, 'level', e.target.value)} />
            </div>
          </div>
        ))}
        <button type="button" className="icon-button" aria-label="Add language" onClick={addLanguage}>+</button>
      </CollapsibleFieldset>

      <button type="button" onClick={downloadPdf} disabled={downloading}>
        {downloading ? 'Generating PDF...' : 'Download PDF'}
      </button>
      {error && <p className="hint error">{error}</p>}
    </div>
  )
})
