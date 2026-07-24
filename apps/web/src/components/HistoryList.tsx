import { useEffect, useState } from 'react'
import type { VacancySummary } from '@cvhelper/shared'
import { api } from '../api'

export function HistoryList({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<VacancySummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listHistory()
      .then(setItems)
      .catch(() => setError('Could not load the history'))
  }, [refreshKey])

  return (
    <div className="panel">
      <h2>History</h2>
      {error && <p className="hint error">{error}</p>}
      {items.length === 0 ? (
        <p>You haven't processed any job postings yet.</p>
      ) : (
        <ul className="history-list">
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.role || 'Untitled role'}</strong> — {item.company || 'Unnamed company'}
              <span className="hint"> ({new Date(item.createdAt).toLocaleString()})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
