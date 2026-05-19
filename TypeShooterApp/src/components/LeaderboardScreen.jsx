import { useState, useEffect } from 'react'
import { fetchBoard } from '../data/leaderboard.js'

const rankEmoji = i => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`
const rankClass = i => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''

const DIFF_COLOR = {
  easy:     '#34d399',
  medium:   '#fbbf24',
  hard:     '#f87171',
  survival: '#a78bfa',
}

export default function LeaderboardScreen({ onBack }) {
  const [tab,     setTab]     = useState('normal')
  const [board,   setBoard]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setBoard([])
    fetchBoard(tab)
      .then(data => { setBoard(data); setLoading(false) })
      .catch(e   => { setError(e.message); setLoading(false) })
  }, [tab])

  return (
    <div className="screen lb-screen">
      <div className="lb-wrap">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h2 className="sub-title">🏆 Global Leaderboard</h2>

        {/* Tabs */}
        <div className="lb-tabs">
          <button id="lb-tab-normal"   className={`lb-tab ${tab === 'normal'   ? 'active' : ''}`} onClick={() => setTab('normal')}>
            🎯 Normal
          </button>
          <button id="lb-tab-survival" className={`lb-tab ${tab === 'survival' ? 'active' : ''}`} onClick={() => setTab('survival')}>
            ♾️ Survival
          </button>
        </div>

        {/* Board */}
        <div className="lb-list" id="lb-list">
          {loading && (
            <div style={{ textAlign: 'center', color: 'var(--dim)', padding: '40px 0', fontSize: 14 }}>
              Loading scores…
            </div>
          )}

          {!loading && error && (
            <div style={{ textAlign: 'center', color: '#f87171', padding: '40px 0', fontSize: 13 }}>
              ⚠️ Could not load scores — check your connection.
            </div>
          )}

          {!loading && !error && board.length === 0 && (
            <p className="lb-empty">No scores yet — be the first! 🚀</p>
          )}

          {!loading && !error && board.map((entry, i) => (
            <div key={i} className={`lb-row ${i < 3 ? 'lb-row-top' : ''}`}>
              <span className={`lb-rank ${rankClass(i)}`}>{rankEmoji(i)}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: 15, color: '#fff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {entry.username}
                </div>
                <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 1 }}>
                  <span style={{
                    color: DIFF_COLOR[entry.diff] || 'var(--dim)',
                    fontWeight: 700, textTransform: 'uppercase', marginRight: 6,
                  }}>
                    {entry.diff}
                  </span>
                  {entry.accuracy}% acc · {entry.errors} err
                </div>
              </div>

              <span className="lb-score" style={{
                fontFamily: 'JetBrains Mono',
                color: i === 0 ? '#fbbf24' : i < 3 ? 'var(--primary2)' : '#fff',
              }}>
                {entry.wpm} <span style={{ fontSize: 11, color: 'var(--dim)' }}>WPM</span>
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--dim)', textAlign: 'center' }}>
          Top 10 scores globally · updated in real time
        </div>
      </div>
    </div>
  )
}
