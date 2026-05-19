import { useState } from 'react'
import MenuScreen from './components/MenuScreen.jsx'
import DifficultyScreen from './components/DifficultyScreen.jsx'
import GameScreen from './components/GameScreen.jsx'
import VersusScreen from './components/VersusScreen.jsx'
import LeaderboardScreen from './components/LeaderboardScreen.jsx'

// screen names: 'menu' | 'difficulty' | 'game' | 'versus' | 'leaderboard'
export default function App() {
  const [screen, setScreen] = useState('menu')
  const [gameConfig, setGameConfig] = useState({ mode: 'normal', diff: 'easy' })

  function goMenu() { setScreen('menu') }

  function startNormal(diff) {
    setGameConfig({ mode: 'normal', diff })
    setScreen('game')
  }

  function startSurvival() {
    setGameConfig({ mode: 'survival', diff: 'medium' })
    setScreen('game')
  }

  return (
    <div className="app">
      {screen === 'menu' && (
        <MenuScreen
          onNormal={() => setScreen('difficulty')}
          onSurvival={startSurvival}
          onVersus={() => setScreen('versus')}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}
      {screen === 'difficulty' && (
        <DifficultyScreen
          onSelect={startNormal}
          onBack={goMenu}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          config={gameConfig}
          onMenu={goMenu}
        />
      )}
      {screen === 'versus' && (
        <VersusScreen onMenu={goMenu} />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={goMenu} />
      )}
    </div>
  )
}
