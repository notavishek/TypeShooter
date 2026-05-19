/* Leaderboard — Supabase backed */
import { supabase } from '../lib/supabase.js'

const WPM_CAP = 250

/**
 * saveScore — inserts one row. Returns { error } or {}.
 */
export async function saveScore(mode, { username, wpm, accuracy, errors, diff }) {
  const clampedWpm = Math.min(Math.round(wpm || 0), WPM_CAP)
  if (clampedWpm <= 0) return { error: 'invalid WPM' }

  const { error } = await supabase.from('leaderboard').insert({
    username: (username || 'Player').trim().slice(0, 20) || 'Player',
    wpm:      clampedWpm,
    accuracy: Math.round(accuracy ?? 100),
    errors:   Math.round(errors   ?? 0),
    mode,
    diff:     diff || mode,
  })

  if (error) console.warn('[leaderboard] save error:', error.message)
  return error ? { error: error.message } : {}
}

/**
 * fetchBoard — top N scores for a given mode, ordered by WPM desc.
 */
export async function fetchBoard(mode, limit = 10) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('username, wpm, accuracy, errors, diff, created_at')
    .eq('mode', mode)
    .order('wpm', { ascending: false })
    .limit(limit)

  if (error) {
    console.warn('[leaderboard] fetch error:', error.message)
    return []
  }
  return data || []
}
