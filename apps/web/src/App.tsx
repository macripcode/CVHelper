import { useState } from 'react'
import './App.css'
import { CandidateForm } from './components/CandidateForm'
import { ReviewAndTailor } from './components/ReviewAndTailor'
import { CvLatexPanel } from './components/CvLatexPanel'
import { HistoryList } from './components/HistoryList'

type Tab = 'candidate' | 'vacancy' | 'history'

function App() {
  const [tab, setTab] = useState<Tab>('candidate')
  const [historyKey, setHistoryKey] = useState(0)

  return (
    <main>
      <h1>CVHelper</h1>
      <nav className="tabs">
        <button type="button" className={tab === 'candidate' ? 'active' : ''} onClick={() => setTab('candidate')}>
          Candidate
        </button>
        <button type="button" className={tab === 'vacancy' ? 'active' : ''} onClick={() => setTab('vacancy')}>
          Review + Tailoring
        </button>
        <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          History
        </button>
      </nav>

      {tab === 'candidate' && <CandidateForm />}
      {tab === 'vacancy' && (
        <div className="two-column">
          <ReviewAndTailor onProcessed={() => setHistoryKey((k) => k + 1)} />
          <CvLatexPanel />
        </div>
      )}
      {tab === 'history' && <HistoryList refreshKey={historyKey} />}
    </main>
  )
}

export default App
