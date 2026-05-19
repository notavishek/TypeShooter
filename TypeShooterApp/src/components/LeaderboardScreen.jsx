import { useState } from 'react'
import { loadBoard } from '../data/leaderboard.js'

export default function LeaderboardScreen({ onBack }) {
  const [tab, setTab] = useState('normal')
  const board = loadBoard(tab === 'survival' ? 'ts_lb_survival' : 'ts_lb_normal')
  const unit  = tab === 'survival' ? ' chars' : ' WPM'

  const rankClass = i => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''
  const rankEmoji = i => ['🥇','🥈','🥉'][i] || (i + 1)

  return (
    <div className="screen lb-screen">
      <div className="lb-wrap">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h2 className="sub-title">🏆 Leaderboard</h2>

        <div className="lb-tabs">
          <button id="lb-tab-normal"    className={`lb-tab ${tab === 'normal'   ? 'active' : ''}`} onClick={() => setTab('normal')}>Normal</button>
          <button id="lb-tab-survival"  className={`lb-tab ${tab === 'survival' ? 'active' : ''}`} onClick={() => setTab('survival')}>Survival</button>
        </div>

        <div className="lb-list" id="lb-list">
          {board.length === 0
            ? <p className="lb-empty">No scores yet — play a game first!</p>
            : board.map((entry, i) => (
                <div key={i} className="lb-row">
                  <span className={`lb-rank ${rankClass(i)}`}>{rankEmoji(i)}</span>
                  <span className="lb-name">{entry.name} · {entry.diff}</span>
                  <span className="lb-score">{entry.score}{unit}</span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
