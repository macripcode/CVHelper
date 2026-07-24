import { useEffect, useState } from 'react'
import type { CvTailoringInput } from '@cvhelper/shared'
import { EMPTY_CV_TAILORING_INPUT } from '@cvhelper/shared'
import { api } from '../api'

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

export function CvLatexPanel() {
  const [resume, setResume] = useState<CvTailoringInput>(EMPTY_CV_TAILORING_INPUT)
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkValue, setNewLinkValue] = useState('')
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

  function updateTechStack(value: string) {
    setResume({
      ...resume,
      techStack: value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    })
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

      <fieldset>
        <legend>Header</legend>
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
      </fieldset>

      <fieldset>
        <legend>Links</legend>
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
      </fieldset>

      <fieldset>
        <legend>Summary</legend>
        <textarea rows={3} value={resume.summary} onChange={(e) => setResume({ ...resume, summary: e.target.value })} />
      </fieldset>

      <fieldset>
        <legend>Tech stack</legend>
        <input
          placeholder="Tech stack (comma-separated)"
          value={resume.techStack.join(', ')}
          onChange={(e) => updateTechStack(e.target.value)}
        />
      </fieldset>

      <fieldset>
        <legend>Work experience</legend>
        {resume.experience.map((exp, i) => (
          <div className="card" key={i}>
            <div className="grid">
              <input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} />
              <input placeholder="Role" value={exp.role} onChange={(e) => updateExperience(i, 'role', e.target.value)} />
              <input placeholder="Project (optional)" value={exp.project} onChange={(e) => updateExperience(i, 'project', e.target.value)} />
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
            <button type="button" className="icon-button" aria-label="Remove experience" onClick={() => removeExperience(i)}>×</button>
          </div>
        ))}
        <button type="button" className="icon-button" aria-label="Add experience" onClick={addExperience}>+</button>
      </fieldset>

      <fieldset>
        <legend>Education</legend>
        {resume.education.map((edu, i) => (
          <div className="card" key={i}>
            <div className="grid">
              <input placeholder="Institution" value={edu.institution} onChange={(e) => updateEducation(i, 'institution', e.target.value)} />
              <input placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} />
              <input placeholder="Start date" value={edu.startDate} onChange={(e) => updateEducation(i, 'startDate', e.target.value)} />
              <input placeholder="End date" value={edu.endDate} onChange={(e) => updateEducation(i, 'endDate', e.target.value)} />
            </div>
            <button type="button" className="icon-button" aria-label="Remove education" onClick={() => removeEducation(i)}>×</button>
          </div>
        ))}
        <button type="button" className="icon-button" aria-label="Add education" onClick={addEducation}>+</button>
      </fieldset>

      <fieldset>
        <legend>Languages</legend>
        {resume.languages.map((lang, i) => (
          <div className="grid" key={i}>
            <input placeholder="Language" value={lang.language} onChange={(e) => updateLanguage(i, 'language', e.target.value)} />
            <input placeholder="Level" value={lang.level} onChange={(e) => updateLanguage(i, 'level', e.target.value)} />
            <button type="button" className="icon-button" aria-label="Remove language" onClick={() => removeLanguage(i)}>×</button>
          </div>
        ))}
        <button type="button" className="icon-button" aria-label="Add language" onClick={addLanguage}>+</button>
      </fieldset>

      <button type="button" onClick={downloadPdf} disabled={downloading}>
        {downloading ? 'Generating PDF...' : 'Download PDF'}
      </button>
      {error && <p className="hint error">{error}</p>}
    </div>
  )
}
