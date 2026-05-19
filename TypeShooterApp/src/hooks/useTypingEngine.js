import { useState, useRef, useCallback } from 'react'
import { playSound } from '../engine/audio.js'

/**
 * useTypingEngine — all typing game logic in one hook
 * Returns:
 *   charStates  — array of { ch, state: 'untyped'|'correct'|'wrong'|'current' }
 *   wpm, accuracy, errors, streak
 *   onInput(e)  — attach to <input onChange>
 *   reset(text) — reset to new paragraph
 *   done        — true when paragraph is fully typed
 */
export function useTypingEngine(onKeystroke) {
  const [text,       setText]       = useState('')
  const [charStates, setCharStates] = useState([])
  const [cursor,     setCursor]     = useState(0)
  const [wpm,        setWpm]        = useState(0)
  const [accuracy,   setAccuracy]   = useState(100)
  const [errors,     setErrors]     = useState(0)
  const [streak,     setStreak]     = useState(0)
  const [done,       setDone]       = useState(false)

  const stateRef = useRef({
    text: '', cursor: 0, total: 0, correct: 0, streak: 0,
    errors: 0, startTime: null, wpmHistory: [],
  })

  const reset = useCallback((newText) => {
    const s = stateRef.current
    s.text = newText; s.cursor = 0; s.total = 0; s.correct = 0
    s.streak = 0; s.errors = 0; s.startTime = null; s.wpmHistory = []
    setText(newText)
    setCharStates(newText.split('').map((ch, i) => ({ ch, state: i === 0 ? 'current' : 'untyped' })))
    setCursor(0); setWpm(0); setAccuracy(100)
    setErrors(0); setStreak(0); setDone(false)
  }, [])

  const onInput = useCallback((e) => {
    const s = stateRef.current
    if (s.cursor >= s.text.length) return

    const val   = e.target.value
    const now   = Date.now()

    // First keystroke starts timer
    if (!s.startTime && val.length > 0) s.startTime = now

    const typed = val[val.length - 1]

    // Backspace: allow going back one
    if (!typed || val.length < s.cursor) {
      if (s.cursor > 0) {
        s.cursor--
        setCharStates(prev => prev.map((c, i) => ({
          ...c,
          state: i === s.cursor ? 'current' : i < s.cursor ? c.state : 'untyped',
        })))
        setCursor(s.cursor)
        e.target.value = val.slice(0, s.cursor)
      }
      return
    }

    const expected = s.text[s.cursor]
    s.total++

    if (typed === expected) {
      s.correct++
      s.streak++
      playSound('key')
      onKeystroke && onKeystroke(_calcWpm(s, now))

      const cursorSnap = s.cursor   // capture before increment
      s.cursor++

      setCharStates(prev => prev.map((c, i) => {
        if (i === cursorSnap)   return { ...c, state: 'correct' }
        if (i === cursorSnap+1) return { ...c, state: 'current' }
        return c
      }))
      setCursor(s.cursor)

      // WPM
      const elapsed = (now - s.startTime) / 60000
      if (elapsed > 0.001) {
        s.wpmHistory.push((s.correct / 5) / elapsed)
        if (s.wpmHistory.length > 8) s.wpmHistory.shift()
        const w = Math.round(s.wpmHistory.reduce((a,b) => a+b, 0) / s.wpmHistory.length)
        setWpm(w)
      }

      setAccuracy(s.total ? Math.round((s.correct / s.total) * 100) : 100)
      setStreak(s.streak)

      if (s.cursor >= s.text.length) {
        setDone(true)
      }
    } else {
      s.errors++
      s.streak = 0
      playSound('wrong')
      setErrors(s.errors)
      setStreak(0)
      const errCursor = s.cursor
      setCharStates(prev => prev.map((c, i) =>
        i === errCursor ? { ...c, state: 'wrong' } : c
      ))
      e.target.value = val.slice(0, val.length - 1)
      setTimeout(() => {
        setCharStates(prev => prev.map((c, i) =>
          i === errCursor ? { ...c, state: 'current' } : c
        ))
      }, 120)
    }
  }, [onKeystroke])

  function _calcWpm(s, now) {
    if (!s.startTime || s.correct === 0) return 0
    const elapsed = (now - s.startTime) / 60000
    return elapsed > 0.001 ? Math.round((s.correct / 5) / elapsed) : 0
  }

  return { text, charStates, cursor, wpm, accuracy, errors, streak, done, reset, onInput }
}
