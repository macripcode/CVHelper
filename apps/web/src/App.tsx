import { useRef } from 'react'
import './App.css'
import { ReviewAndTailor } from './components/ReviewAndTailor'
import { CvLatexPanel } from './components/CvLatexPanel'
import type { CvLatexPanelHandle } from './components/CvLatexPanel'

function App() {
  const cvPanelRef = useRef<CvLatexPanelHandle>(null)

  return (
    <main>
      <h1>CVHelper</h1>
      <div className="two-column">
        <ReviewAndTailor
          onUseTechStack={(techStack) => cvPanelRef.current?.replaceTechStack(techStack)}
          onUseSummary={(summary) => cvPanelRef.current?.replaceSummary(summary)}
        />
        <CvLatexPanel ref={cvPanelRef} />
      </div>
    </main>
  )
}

export default App
