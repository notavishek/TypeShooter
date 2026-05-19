import { useEffect, useRef, useState, useCallback } from 'react'
import { GameEngine } from '../engine/GameEngine.js'
import { useTypingEngine } from '../hooks/useTypingEngine.js'
import { getParagraph } from '../data/paragraphs.js'
import { playSound } from '../engine/audio.js'
import { saveScore } from '../data/leaderboard.js'

/* ── WPM Graph ────────────────────────────────────────────── */
function WpmGraph({ data }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width  = canvas.offsetWidth  || 360
    const H = canvas.height = canvas.offsetHeight || 220
    ctx.clearRect(0, 0, W, H)

    const maxWpm = Math.max(...data.map(d => d.wpm), 10)
    const PAD = { t: 10, r: 10, b: 24, l: 36 }
    const gW = W - PAD.l - PAD.r
    const gH = H - PAD.t - PAD.b

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = PAD.t + (gH * i / 4)
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke()
      ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '9px JetBrains Mono, monospace'
      ctx.fillText(Math.round(maxWpm * (1 - i / 4)), 0, y + 3)
    }

    // X axis label
    ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '9px Outfit, sans-serif'
    ctx.fillText('time →', W - PAD.r - 30, H - 4)

    // Area fill
    const grad = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + gH)
    grad.addColorStop(0, 'rgba(108,99,255,0.35)')
    grad.addColorStop(1, 'rgba(108,99,255,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    data.forEach((d, i) => {
      const x = PAD.l + (i / (data.length - 1)) * gW
      const y = PAD.t + gH * (1 - d.wpm / maxWpm)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.lineTo(PAD.l + gW, PAD.t + gH)
    ctx.lineTo(PAD.l, PAD.t + gH)
    ctx.closePath(); ctx.fill()

    // Line
    ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    ctx.shadowBlur = 8; ctx.shadowColor = '#6c63ff'
    ctx.beginPath()
    data.forEach((d, i) => {
      const x = PAD.l + (i / (data.length - 1)) * gW
      const y = PAD.t + gH * (1 - d.wpm / maxWpm)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke(); ctx.shadowBlur = 0

    // Dots
    ctx.fillStyle = '#a78bfa'
    data.forEach((d, i) => {
      const x = PAD.l + (i / (data.length - 1)) * gW
      const y = PAD.t + gH * (1 - d.wpm / maxWpm)
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
    })
  }, [data])

  return (
    <canvas ref={ref} style={{ width: '100%', height: 220, display: 'block' }} />
  )
}

/* ── Shared Results Overlay ───────────────────────────────── */
function ResultsScreen({
  title, wpm, accuracy, errors, timeMs, wpmTimeline,
  extraStats, diff, onRestart, onMenu, overlayId,
}) {
  const timeSec = (timeMs / 1000).toFixed(1)

  return (
    <div className="overlay" id={overlayId}>
      <div className="overlay-box" style={{
        width: 'min(90vw, 820px)', maxWidth: '100%',
        padding: '36px 44px', textAlign: 'left',
      }}>
        <h2 style={{ fontSize: 26, marginBottom: 24, textAlign: 'center' }}>{title}</h2>

        {/* Main stats */}
        <div className="stats-grid" style={{ marginBottom: 24, gap: 32 }}>
          <div className="stat-item">
            <span className="stat-label" style={{ fontSize: 11 }}>WPM</span>
            <span className="stat-val" style={{ fontSize: 52, lineHeight: 1 }}>{wpm}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label" style={{ fontSize: 11 }}>Accuracy</span>
            <span className="stat-val" style={{ fontSize: 38 }}>{accuracy}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label" style={{ fontSize: 11 }}>Errors</span>
            <span className="stat-val" style={{ fontSize: 38, color: errors > 0 ? '#f87171' : '#34d399' }}>{errors}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label" style={{ fontSize: 11 }}>Time</span>
            <span className="stat-val" style={{ fontSize: 38 }}>{timeSec}s</span>
          </div>
          {/* Extra mode-specific stats (e.g. Waves for survival) */}
          {extraStats?.map(({ label, value, color }) => (
            <div className="stat-item" key={label}>
              <span className="stat-label" style={{ fontSize: 11 }}>{label}</span>
              <span className="stat-val" style={{ fontSize: 38, ...(color ? { color } : {}) }}>{value}</span>
            </div>
          ))}
        </div>

        {/* WPM Graph */}
        {wpmTimeline.length >= 2 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--mute)' }}>
                WPM over time
              </span>
              <span style={{ fontSize: 13, color: 'var(--primary2)', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                peak {Math.max(...wpmTimeline.map(d => d.wpm))} WPM
              </span>
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.35)', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.07)', padding: '10px 6px 6px',
            }}>
              <WpmGraph data={wpmTimeline} />
            </div>
          </div>
        )}

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--dim)' }}>
            {diff
              ? <>Difficulty: <span style={{
                  color: diff === 'easy' ? 'var(--green)' : diff === 'medium' ? 'var(--yellow)' : 'var(--red)',
                  fontWeight: 700, textTransform: 'uppercase',
                }}>{diff}</span></>
              : null}
          </span>
          <div className="btn-row" style={{ margin: 0 }}>
            <button className="btn-primary" id="btn-result-restart" onClick={onRestart}>Play Again</button>
            <button className="btn-ghost"   id="btn-result-menu"   onClick={onMenu}>Main Menu</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── GameScreen ──────────────────────────────────────────── */
export default function GameScreen({ config, onMenu }) {
  const { mode, diff } = config
  const canvasRef  = useRef(null)
  const inputRef   = useRef(null)
  const engineRef  = useRef(null)

  const [lives,      setLives]      = useState(3)
  const [wave,       setWave]       = useState(1)
  const [wpmHud,     setWpmHud]     = useState(0)
  const [accHud,     setAccHud]     = useState(100)
  const [waveBanner, setWaveBanner] = useState(null)
  const [gameDone,   setGameDone]   = useState(null)  // unified results for both modes
  const [countdown,  setCountdown]  = useState(null)  // 3|2|1|'GO!'|null
  const countdownRef = useRef(null)

  // WPM timeline — survival accumulates across paragraphs, normal resets each para
  const wpmTimelineRef = useRef([])
  const [wpmTimeline,  setWpmTimeline] = useState([])
  const sampleTimerRef = useRef(null)
  const sessionStartRef = useRef(null)   // set when countdown clears
  const paraStartRef   = useRef(null)    // used for normal mode timing

  // Always-current refs — avoid stale closures inside engine callbacks
  const currentWpmRef = useRef(0)
  const currentAccRef = useRef(100)
  const currentErrRef = useRef(0)
  const currentWaveRef = useRef(1)

  /* Typing engine */
  const onKeystroke = useCallback((wpm) => {
    engineRef.current?.onKeystroke(wpm)
  }, [])
  const typing = useTypingEngine(onKeystroke)

  /**
   * startSampling(resetHistory)
   *   Normal mode:   always resetHistory = true  (one para = one chart)
   *   Survival mode: resetHistory = false         (accumulate whole session)
   */
  function startSampling(resetHistory = true) {
    if (resetHistory) {
      paraStartRef.current = Date.now()
      wpmTimelineRef.current = []
    }
    clearInterval(sampleTimerRef.current)
    sampleTimerRef.current = setInterval(() => {
      const w = currentWpmRef.current
      if (w > 0) {
        wpmTimelineRef.current = [...wpmTimelineRef.current, {
          t:   (Date.now() - (sessionStartRef.current || Date.now())) / 1000,
          wpm: w,
        }]
      }
    }, 1000)
  }

  function stopSampling() {
    clearInterval(sampleTimerRef.current)
    const w = currentWpmRef.current
    if (w > 0) {
      wpmTimelineRef.current = [...wpmTimelineRef.current, {
        t:   (Date.now() - (sessionStartRef.current || Date.now())) / 1000,
        wpm: w,
      }]
    }
    setWpmTimeline([...wpmTimelineRef.current])
  }

  /* Countdown */
  function beginCountdown(cb) {
    let n = 3
    setCountdown(n)
    countdownRef.current = setInterval(() => {
      n--
      if (n > 0) {
        setCountdown(n)
      } else {
        clearInterval(countdownRef.current)
        setCountdown('GO!')
        setTimeout(() => { setCountdown(null); cb() }, 650)
      }
    }, 1000)
  }

  /* Load first paragraph + start countdown */
  useEffect(() => {
    typing.reset(getParagraph(diff))
    if (inputRef.current) inputRef.current.value = ''
    wpmTimelineRef.current = []
    beginCountdown(() => startSampling(true))
  }, [diff])  // eslint-disable-line react-hooks/exhaustive-deps

  /* Paragraph complete */
  useEffect(() => {
    if (!typing.done) return
    if (mode === 'normal') {
      stopSampling()
      engineRef.current?.stop()
      const elapsed = Date.now() - (paraStartRef.current || Date.now())
      saveScore('normal', { name: 'Player', wpm: currentWpmRef.current, diff })
      playSound('win')
      setGameDone({
        title:    '🏁 Paragraph Complete',
        wpm:      currentWpmRef.current,
        accuracy: currentAccRef.current,
        errors:   currentErrRef.current,
        timeMs:   elapsed,
        extraStats: null,
      })
    } else {
      // Survival: clear input, load next paragraph, keep WPM history going
      if (inputRef.current) inputRef.current.value = ''
      typing.reset(getParagraph(diff))
      startSampling(false)   // keep accumulating
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [typing.done])  // eslint-disable-line react-hooks/exhaustive-deps

  /* Sync HUD + always-current refs */
  useEffect(() => {
    setWpmHud(typing.wpm)
    currentWpmRef.current = typing.wpm
  }, [typing.wpm])
  useEffect(() => {
    setAccHud(typing.accuracy)
    currentAccRef.current = typing.accuracy
  }, [typing.accuracy])
  useEffect(() => { currentErrRef.current = typing.errors }, [typing.errors])
  useEffect(() => { currentWaveRef.current = wave }, [wave])

  /* Build engine (start deferred to countdown useEffect) */
  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new GameEngine(canvasRef.current, {
      mode, diff,
      onLifeLost: (l) => { playSound('life_lost'); setLives(l) },
      onGameOver: (info) => {
        stopSampling()
        playSound('game_over')
        const elapsed = Date.now() - (sessionStartRef.current || Date.now())
        saveScore(mode === 'survival' ? 'survival' : 'normal', {
          name: 'Player', wpm: currentWpmRef.current, diff,
        })
        setGameDone({
          title:     mode === 'survival' ? '💀 Survival Over' : '💥 Game Over',
          wpm:       currentWpmRef.current,
          accuracy:  currentAccRef.current,
          errors:    currentErrRef.current,
          timeMs:    elapsed,
          extraStats: mode === 'survival'
            ? [{ label: 'Waves', value: currentWaveRef.current }]
            : [
                { label: 'Wave',  value: info.wave  },
                { label: 'Score', value: info.score },
              ],
        })
      },
      onWaveComplete: (w) => {
        playSound('wave'); setWave(w)
        setWaveBanner(w); setTimeout(() => setWaveBanner(null), 1800)
      },
    })
    engineRef.current = engine
    return () => { engine.stop(); clearInterval(sampleTimerRef.current); clearInterval(countdownRef.current) }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  /* Start engine + focus input once countdown clears */
  useEffect(() => {
    if (countdown !== null) return
    if (engineRef.current && !engineRef.current.running) {
      sessionStartRef.current = Date.now()
      paraStartRef.current    = Date.now()
      engineRef.current.start()
    }
    inputRef.current?.focus()
  }, [countdown])

  function handleRestart() {
    engineRef.current?.stop()
    clearInterval(countdownRef.current)
    setGameDone(null)
    setLives(3); setWave(1); setWpmHud(0); setAccHud(100)
    setWpmTimeline([]); wpmTimelineRef.current = []
    currentWpmRef.current = 0; currentAccRef.current = 100; currentErrRef.current = 0; currentWaveRef.current = 1
    if (inputRef.current) inputRef.current.value = ''
    typing.reset(getParagraph(diff))
    const engine = new GameEngine(canvasRef.current, {
      mode, diff,
      onLifeLost: (l) => { playSound('life_lost'); setLives(l) },
      onGameOver: (info) => {
        stopSampling(); playSound('game_over')
        const elapsed = Date.now() - (sessionStartRef.current || Date.now())
        saveScore(mode === 'survival' ? 'survival' : 'normal', { name: 'Player', wpm: currentWpmRef.current, diff })
        setGameDone({
          title:     mode === 'survival' ? '💀 Survival Over' : '💥 Game Over',
          wpm:       currentWpmRef.current,
          accuracy:  currentAccRef.current,
          errors:    currentErrRef.current,
          timeMs:    elapsed,
          extraStats: mode === 'survival'
            ? [{ label: 'Waves', value: currentWaveRef.current }]
            : [{ label: 'Wave', value: info.wave }, { label: 'Score', value: info.score }],
        })
      },
      onWaveComplete: (w) => {
        playSound('wave'); setWave(w)
        setWaveBanner(w); setTimeout(() => setWaveBanner(null), 1800)
      },
    })
    engineRef.current = engine
    beginCountdown(() => startSampling(true))
  }

  const livesArr = Array.from({ length: 3 }, (_, i) => i < lives)

  return (
    <div className="screen game-screen">
      {/* HUD */}
      <div className="hud">
        <div className="hud-group">
          <span className="hud-label">WPM</span>
          <span className="hud-val" id="hud-wpm">{wpmHud}</span>
          <span className="hud-label" style={{ marginLeft: 14 }}>ACC</span>
          <span className="hud-val" id="hud-acc">{accHud}%</span>
        </div>
        <div className="hud-center">
          <span className="hud-mode" id="hud-mode">
            {mode === 'survival' ? 'SURVIVAL' : `NORMAL · ${diff.toUpperCase()}`}
          </span>
          <div className="hud-lives" id="hud-lives">
            {livesArr.map((alive, i) => (
              <span key={i}>{alive ? '❤️' : '🖤'}</span>
            ))}
          </div>
        </div>
        <div className="hud-group">
          <span className="hud-label">WAVE</span>
          <span className="hud-val" id="hud-wave">{wave}</span>
          <span className="hud-label" style={{ marginLeft: 14 }}>ERR</span>
          <span className="hud-val" id="hud-err" style={{ color: '#f87171' }}>{typing.errors}</span>
          <button className="btn-menu-hud" id="btn-menu-hud" style={{ marginLeft: 16 }}
            onClick={() => { engineRef.current?.stop(); clearInterval(sampleTimerRef.current); onMenu() }}>
            ⬅ Menu
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="canvas-wrap">
        <canvas id="game-canvas" ref={canvasRef} />

        {waveBanner && (
          <div className="wave-banner" id="wave-banner">WAVE {waveBanner}</div>
        )}

        {/* Countdown */}
        {countdown !== null && (
          <div className="countdown-overlay" id="countdown-overlay">
            <span
              key={countdown}
              className={`countdown-num ${countdown === 'GO!' ? 'countdown-go' : ''}`}
            >
              {countdown}
            </span>
          </div>
        )}

        {/* Results overlay — shared by Normal (paragraph done) and both modes' game-over */}
        {gameDone && (
          <ResultsScreen
            title={gameDone.title}
            wpm={gameDone.wpm}
            accuracy={gameDone.accuracy}
            errors={gameDone.errors}
            timeMs={gameDone.timeMs}
            wpmTimeline={wpmTimeline}
            extraStats={gameDone.extraStats}
            diff={diff}
            overlayId="results-overlay"
            onRestart={handleRestart}
            onMenu={() => { clearInterval(sampleTimerRef.current); onMenu() }}
          />
        )}
      </div>

      {/* Typing area */}
      <div className="typing-area">
        <div className="para-display" id="para-display">
          {typing.charStates.map((c, i) => (
            <span key={i} className={`ch ${
              c.state === 'correct' ? 'ok' : c.state === 'wrong' ? 'err' : c.state === 'current' ? 'cur' : ''
            }`}>{c.ch}</span>
          ))}
        </div>
        <input
          id="typing-input" ref={inputRef}
          className="typing-input" type="text"
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          placeholder={mode === 'normal' ? 'Type the paragraph above to complete the wave…' : 'Start typing to survive…'}
          onChange={typing.onInput}
          disabled={!!gameDone || countdown !== null}
        />
        <div className="typing-meta">
          <span id="meta-chars">{typing.charStates.filter(c => c.state === 'correct').length} / {typing.text.length} chars</span>
          <span id="meta-err">{typing.errors} errors</span>
          <span id="meta-streak">🔥 {typing.streak} streak</span>
          {mode === 'normal' && <span style={{ marginLeft: 'auto', color: 'var(--primary2)', fontSize: 11 }}>finish the paragraph →</span>}
        </div>
      </div>
    </div>
  )
}
