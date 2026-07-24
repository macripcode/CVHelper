import './App.css'
import { ReviewAndTailor } from './components/ReviewAndTailor'
import { CvLatexPanel } from './components/CvLatexPanel'

function App() {
  return (
    <main>
      <h1>CVHelper</h1>
      <div className="two-column">
        <ReviewAndTailor />
        <CvLatexPanel />
      </div>
    </main>
  )
}

export default App
