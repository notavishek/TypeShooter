/* Leaderboard — localStorage persistence */

const KEYS = { normal: 'ts_lb_normal', survival: 'ts_lb_survival' }

export function saveScore(mode, entry) {
  const key = KEYS[mode] || KEYS.normal
  let board = loadBoard(key)
  const score = mode === 'survival' ? (entry.chars || 0) : (entry.wpm || 0)
  board.push({ name: entry.name || 'Player', score, diff: entry.diff || mode, date: Date.now() })
  board.sort((a, b) => b.score - a.score)
  try { localStorage.setItem(key, JSON.stringify(board.slice(0, 10))) } catch(_) {}
}

export function loadBoard(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch(_) { return [] }
}
