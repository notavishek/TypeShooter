import { useState, useEffect, useCallback } from 'react'
import MenuScreen        from './components/MenuScreen.jsx'
import DifficultyScreen  from './components/DifficultyScreen.jsx'
import GameScreen        from './components/GameScreen.jsx'
import VersusScreen      from './components/VersusScreen.jsx'
import LeaderboardScreen from './components/LeaderboardScreen.jsx'

/* ── History-aware navigation ────────────────────────────────
   Every navigate() call pushes a browser history entry.
   popstate (Back / Forward buttons) syncs React state back.
────────────────────────────────────────────────────────────── */
function readHistoryState() {
  const s = window.history.state
  return s?.screen ? s : { screen: 'menu', gameConfig: { mode: 'normal', diff: 'easy' } }
}

export default function App() {
  const initial      = readHistoryState()
  const [screen,     setScreen]     = useState(initial.screen)
  const [gameConfig, setGameConfig] = useState(initial.gameConfig)

  /* Seed the very first history entry so Back always has somewhere to go */
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState(
        { screen: 'menu', gameConfig: { mode: 'normal', diff: 'easy' } },
        '', '#menu'
      )
    }
    const onPop = (e) => {
      const state = e.state
      if (state?.screen) {
        setScreen(state.screen)
        setGameConfig(state.gameConfig || { mode: 'normal', diff: 'easy' })
      } else {
        setScreen('menu')
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  /** navigate — pushes a history entry then updates React state */
  const navigate = useCallback((newScreen, newConfig = null) => {
    const cfg = newConfig ?? gameConfig
    window.history.pushState(
      { screen: newScreen, gameConfig: cfg },
      '', `#${newScreen}`
    )
    setScreen(newScreen)
    if (newConfig) setGameConfig(newConfig)
  }, [gameConfig])

  /** goBack — uses browser history if available, otherwise goes to menu */
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      navigate('menu')
    }
  }, [navigate])

  /* ── Transition helpers ─────────────────────────────────── */
  function goMenu()          { navigate('menu') }
  function goDifficulty()    { navigate('difficulty') }
  function goVersus()        { navigate('versus') }
  function goLeaderboard()   { navigate('leaderboard') }

  function startNormal(diff) {
    const cfg = { mode: 'normal', diff }
    navigate('game', cfg)
  }

  function startSurvival() {
    const cfg = { mode: 'survival', diff: 'medium' }
    navigate('game', cfg)
  }

  return (
    <div className="app">
      {screen === 'menu' && (
        <MenuScreen
          onNormal={goDifficulty}
          onSurvival={startSurvival}
          onVersus={goVersus}
          onLeaderboard={goLeaderboard}
        />
      )}
      {screen === 'difficulty' && (
        <DifficultyScreen
          onSelect={startNormal}
          onBack={goBack}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          config={gameConfig}
          onMenu={goMenu}
        />
      )}
      {screen === 'versus' && (
        <VersusScreen onMenu={goBack} />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={goBack} />
      )}
    </div>
  )
}
