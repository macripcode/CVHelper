import { useEffect, useState } from 'react'
import type { Candidate } from '@cvhelper/shared'
import { EMPTY_CANDIDATE } from '@cvhelper/shared'
import { api } from '../api'

export function CandidateForm() {
  const [candidate, setCandidate] = useState<Candidate>(EMPTY_CANDIDATE)
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('loading')

  useEffect(() => {
    api
      .getCandidate()
      .then(setCandidate)
      .then(() => setStatus('idle'))
      .catch(() => setStatus('error'))
  }, [])

  async function save() {
    setStatus('saving')
    try {
      await api.saveCandidate(candidate)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  function updatePersonal<K extends keyof Candidate['personal']>(key: K, value: Candidate['personal'][K]) {
    setCandidate({ ...candidate, personal: { ...candidate.personal, [key]: value } })
  }

  function updateListField(key: 'techStack' | 'softSkills', value: string) {
    setCandidate({
      ...candidate,
      [key]: value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    })
  }

  function addExperience() {
    setCandidate({
      ...candidate,
      experience: [
        ...candidate.experience,
        { company: '', role: '', project: '', startDate: '', endDate: '', description: '', achievements: [] },
      ],
    })
  }

  function updateExperience(index: number, field: keyof Candidate['experience'][number], value: string | string[]) {
    const experience = [...candidate.experience]
    experience[index] = { ...experience[index], [field]: value }
    setCandidate({ ...candidate, experience })
  }

  function removeExperience(index: number) {
    setCandidate({ ...candidate, experience: candidate.experience.filter((_, i) => i !== index) })
  }

  function addEducation() {
    setCandidate({
      ...candidate,
      education: [...candidate.education, { institution: '', degree: '', startDate: '', endDate: '' }],
    })
  }

  function updateEducation(index: number, field: keyof Candidate['education'][number], value: string) {
    const education = [...candidate.education]
    education[index] = { ...education[index], [field]: value }
    setCandidate({ ...candidate, education })
  }

  function removeEducation(index: number) {
    setCandidate({ ...candidate, education: candidate.education.filter((_, i) => i !== index) })
  }

  function addLanguage() {
    setCandidate({ ...candidate, languages: [...candidate.languages, { language: '', level: '' }] })
  }

  function updateLanguage(index: number, field: keyof Candidate['languages'][number], value: string) {
    const languages = [...candidate.languages]
    languages[index] = { ...languages[index], [field]: value }
    setCandidate({ ...candidate, languages })
  }

  function removeLanguage(index: number) {
    setCandidate({ ...candidate, languages: candidate.languages.filter((_, i) => i !== index) })
  }

  if (status === 'loading') return <p>Loading profile...</p>

  return (
    <div className="panel">
      <h2>Candidate</h2>

      <fieldset>
        <legend>Personal details</legend>
        <div className="grid">
          <input placeholder="Name" value={candidate.personal.name} onChange={(e) => updatePersonal('name', e.target.value)} />
          <input placeholder="Professional title" value={candidate.personal.professionalTitle} onChange={(e) => updatePersonal('professionalTitle', e.target.value)} />
          <input placeholder="Email" value={candidate.personal.email} onChange={(e) => updatePersonal('email', e.target.value)} />
          <input placeholder="Phone" value={candidate.personal.phone} onChange={(e) => updatePersonal('phone', e.target.value)} />
          <input placeholder="Location" value={candidate.personal.location} onChange={(e) => updatePersonal('location', e.target.value)} />
          <input placeholder="LinkedIn" value={candidate.personal.linkedin} onChange={(e) => updatePersonal('linkedin', e.target.value)} />
          <input placeholder="GitHub" value={candidate.personal.github} onChange={(e) => updatePersonal('github', e.target.value)} />
          <input placeholder="Website" value={candidate.personal.website} onChange={(e) => updatePersonal('website', e.target.value)} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Professional summary</legend>
        <textarea
          rows={3}
          value={candidate.summary}
          onChange={(e) => setCandidate({ ...candidate, summary: e.target.value })}
        />
      </fieldset>

      <fieldset>
        <legend>Work experience</legend>
        {candidate.experience.map((exp, i) => (
          <div className="card" key={i}>
            <div className="grid">
              <input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} />
              <input placeholder="Role" value={exp.role} onChange={(e) => updateExperience(i, 'role', e.target.value)} />
              <input placeholder="Project (optional)" value={exp.project} onChange={(e) => updateExperience(i, 'project', e.target.value)} />
              <input placeholder="Start date (YYYY-MM)" value={exp.startDate} onChange={(e) => updateExperience(i, 'startDate', e.target.value)} />
              <input placeholder="End date (YYYY-MM or Present)" value={exp.endDate} onChange={(e) => updateExperience(i, 'endDate', e.target.value)} />
            </div>
            <textarea
              rows={2}
              placeholder="Description"
              value={exp.description}
              onChange={(e) => updateExperience(i, 'description', e.target.value)}
            />
            <textarea
              rows={2}
              placeholder="Achievements (one per line)"
              value={exp.achievements.join('\n')}
              onChange={(e) => updateExperience(i, 'achievements', e.target.value.split('\n').filter(Boolean))}
            />
            <button type="button" onClick={() => removeExperience(i)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addExperience}>+ Add experience</button>
      </fieldset>

      <fieldset>
        <legend>Education</legend>
        {candidate.education.map((edu, i) => (
          <div className="card" key={i}>
            <div className="grid">
              <input placeholder="Institution" value={edu.institution} onChange={(e) => updateEducation(i, 'institution', e.target.value)} />
              <input placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} />
              <input placeholder="Start date" value={edu.startDate} onChange={(e) => updateEducation(i, 'startDate', e.target.value)} />
              <input placeholder="End date" value={edu.endDate} onChange={(e) => updateEducation(i, 'endDate', e.target.value)} />
            </div>
            <button type="button" onClick={() => removeEducation(i)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addEducation}>+ Add education</button>
      </fieldset>

      <fieldset>
        <legend>Languages</legend>
        {candidate.languages.map((lang, i) => (
          <div className="grid" key={i}>
            <input placeholder="Language" value={lang.language} onChange={(e) => updateLanguage(i, 'language', e.target.value)} />
            <input placeholder="Level" value={lang.level} onChange={(e) => updateLanguage(i, 'level', e.target.value)} />
            <button type="button" onClick={() => removeLanguage(i)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addLanguage}>+ Add language</button>
      </fieldset>

      <fieldset>
        <legend>Tech stack and soft skills</legend>
        <input
          placeholder="Tech stack (comma-separated)"
          value={candidate.techStack.join(', ')}
          onChange={(e) => updateListField('techStack', e.target.value)}
        />
        <input
          placeholder="Soft skills (comma-separated)"
          value={candidate.softSkills.join(', ')}
          onChange={(e) => updateListField('softSkills', e.target.value)}
        />
      </fieldset>

      <fieldset>
        <legend>Expected salary</legend>
        <div className="grid">
          <input
            type="number"
            placeholder="Amount"
            value={candidate.expectedSalary.amount ?? ''}
            onChange={(e) =>
              setCandidate({
                ...candidate,
                expectedSalary: { ...candidate.expectedSalary, amount: e.target.value ? Number(e.target.value) : null },
              })
            }
          />
          <input
            placeholder="Currency"
            value={candidate.expectedSalary.currency}
            onChange={(e) => setCandidate({ ...candidate, expectedSalary: { ...candidate.expectedSalary, currency: e.target.value } })}
          />
          <input
            placeholder="Period (monthly/yearly)"
            value={candidate.expectedSalary.period}
            onChange={(e) => setCandidate({ ...candidate, expectedSalary: { ...candidate.expectedSalary, period: e.target.value } })}
          />
        </div>
      </fieldset>

      <button type="button" onClick={save} disabled={status === 'saving'}>
        {status === 'saving' ? 'Saving...' : 'Save profile'}
      </button>
      {status === 'saved' && <span className="hint">Saved ✓</span>}
      {status === 'error' && <span className="hint error">Error saving profile</span>}
    </div>
  )
}
