import { useState, useRef, useEffect } from 'react'
import { getParagraph } from '../data/paragraphs.js'
import { playSound } from '../engine/audio.js'

/**
 * Versus Mode
 * "Same Device"  — two players share a keyboard (P1 top, P2 bottom)
 * "Online"       — plays vs AI simulation currently; real cross-device
 *                  play requires Supabase (free) — see Settings.
 */

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ── Race Track ───────────────────────────────────
function RaceTrack({ p1Progress, p2Progress }) {
  const ref  = useRef(null)
  const p1X  = useRef(0)
  const p2X  = useRef(0)
  const p1Pr = useRef(p1Progress)
  const p2Pr = useRef(p2Progress)
  p1Pr.current = p1Progress
  p2Pr.current = p2Progress

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, W, H

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      W = canvas.width  = rect.width  || window.innerWidth
      H = canvas.height = rect.height || 80
    }
    window.addEventListener('resize', resize); resize()

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const grd = ctx.createLinearGradient(0, 0, W, 0)
      grd.addColorStop(0, '#08081a'); grd.addColorStop(1, '#10102a')
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H)

      const PAD = 50, trackW = W - PAD * 2
      ctx.strokeStyle = 'rgba(108,99,255,0.18)'; ctx.lineWidth = 1; ctx.setLineDash([6, 10])
      ;[H * 0.28, H * 0.72].forEach(y => {
        ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
      })
      ctx.setLineDash([])
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(W - PAD, 2); ctx.lineTo(W - PAD, H - 2); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 10px Outfit, sans-serif'
      ctx.fillText('FINISH', W - PAD - 24, H - 4)

      p1X.current += (PAD + p1Pr.current * trackW - p1X.current) * 0.14
      p2X.current += (PAD + p2Pr.current * trackW - p2X.current) * 0.14

      _ship(ctx, p1X.current, H * 0.28, '#6c63ff', '#a78bfa')
      _ship(ctx, p2X.current, H * 0.72, '#f472b6', '#fb923c')
      ctx.fillStyle = '#a78bfa'; ctx.font = 'bold 10px Outfit'
      ctx.fillText('YOU', p1X.current - 12, H * 0.28 - 14)
      ctx.fillStyle = '#f472b6'
      ctx.fillText('OPP', p2X.current - 12, H * 0.72 + 22)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} id="versus-canvas" style={{ width: '100%', height: '100%' }} />
}

function _ship(ctx, x, y, c1, c2) {
  ctx.save(); ctx.shadowBlur = 12; ctx.shadowColor = c1; ctx.fillStyle = c1
  ctx.beginPath(); ctx.moveTo(x - 18, y - 10); ctx.lineTo(x + 18, y)
  ctx.lineTo(x - 18, y + 10); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.fill()
  ctx.fillStyle = c2; ctx.shadowColor = c2
  ctx.beginPath(); ctx.ellipse(x - 14, y, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

// ── Typing Panel ─────────────────────────────────
function TypingPanel({ para, onProgress, onComplete, disabled, placeholder, label, labelClass }) {
  const inputRef = useRef(null)
  const stateRef = useRef({ cursor: 0, correct: 0, total: 0, startTime: null, wpmHistory: [] })
  const [charStates, setCharStates] = useState(() =>
    para.split('').map((ch, i) => ({ ch, state: i === 0 ? 'current' : 'untyped' }))
  )
  const [wpm, setWpm] = useState(0)

  useEffect(() => {
    const s = stateRef.current
    s.cursor = 0; s.correct = 0; s.total = 0; s.startTime = null; s.wpmHistory = []
    setCharStates(para.split('').map((ch, i) => ({ ch, state: i === 0 ? 'current' : 'untyped' })))
    setWpm(0)
    if (inputRef.current) inputRef.current.value = ''
  }, [para])

  useEffect(() => { if (!disabled) inputRef.current?.focus() }, [disabled])

  const handleInput = (e) => {
    const s = stateRef.current
    if (s.cursor >= para.length || disabled) return
    const val = e.target.value, now = Date.now()
    if (!s.startTime && val.length > 0) s.startTime = now
    const typed = val[val.length - 1]

    if (!typed || val.length < s.cursor) {
      if (s.cursor > 0) {
        s.cursor--
        setCharStates(prev => prev.map((c, i) => ({
          ...c, state: i === s.cursor ? 'current' : i < s.cursor ? c.state : 'untyped',
        })))
        e.target.value = val.slice(0, s.cursor)
      }
      return
    }
    s.total++
    if (typed === para[s.cursor]) {
      s.correct++; playSound('key')
      const next = s.cursor + 1
      setCharStates(prev => prev.map((c, i) =>
        i === s.cursor ? { ...c, state: 'correct' } : i === next ? { ...c, state: 'current' } : c
      ))
      s.cursor = next; onProgress(next / para.length)
      const elapsed = (now - s.startTime) / 60000
      if (elapsed > 0.001) {
        s.wpmHistory.push((s.correct / 5) / elapsed)
        if (s.wpmHistory.length > 8) s.wpmHistory.shift()
        setWpm(Math.round(s.wpmHistory.reduce((a, b) => a + b, 0) / s.wpmHistory.length))
      }
      if (s.cursor >= para.length) onComplete()
    } else {
      playSound('wrong')
      e.target.value = val.slice(0, val.length - 1)
    }
  }

  return (
    <div className="v-panel">
      <span className={`v-label ${labelClass}`}>
        {label} — <strong style={{ fontFamily: 'JetBrains Mono', color: 'var(--primary2)' }}>{wpm} WPM</strong>
      </span>
      <div className="para-display">
        {charStates.map((c, i) => (
          <span key={i} className={`ch ${c.state === 'correct' ? 'ok' : c.state === 'wrong' ? 'err' : c.state === 'current' ? 'cur' : ''}`}>
            {c.ch}
          </span>
        ))}
      </div>
      <input ref={inputRef} className="typing-input" type="text"
        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        placeholder={placeholder} onChange={handleInput} disabled={disabled}
      />
    </div>
  )
}

// ── Main ─────────────────────────────────────────
export default function VersusScreen({ onMenu }) {
  const [phase,     setPhase]     = useState('lobby')
  const [lobbyTab,  setLobbyTab]  = useState('local')
  const [roomCode,  setRoomCode]  = useState('')
  const [joinInput, setJoinInput] = useState('')
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' })
  const [isCreator, setIsCreator] = useState(false)
  const [para,        setPara]        = useState(() => getParagraph('medium'))
  const [p1Progress,  setP1Progress]  = useState(0)
  const [p2Progress,  setP2Progress]  = useState(0)
  const [p1Done,      setP1Done]      = useState(false)
  const [p2Done,      setP2Done]      = useState(false)
  const [result,      setResult]      = useState(null)
  const simRef = useRef(null)

  function startLocalGame() {
    setPara(getParagraph('medium'))
    setP1Progress(0); setP2Progress(0); setP1Done(false); setP2Done(false)
    setResult(null); setPhase('game')
  }

  function createRoom() {
    const code = genCode(); setRoomCode(code); setIsCreator(true)
    setStatusMsg({ text: 'Code generated! Simulated opponent starts in 3s…', type: 'ok' })
    setTimeout(() => startOnlineGame(), 3000)
  }

  function joinRoom() {
    const code = joinInput.trim().toUpperCase()
    if (code.length !== 6) { setStatusMsg({ text: 'Code must be exactly 6 characters', type: 'err' }); return }
    setRoomCode(code); setIsCreator(false)
    setStatusMsg({ text: 'Joining… simulated game starting!', type: 'ok' })
    setTimeout(() => startOnlineGame(), 1000)
  }

  function startOnlineGame() {
    const p = getParagraph('medium'); setPara(p)
    setP1Progress(0); setP2Progress(0); setP1Done(false); setP2Done(false)
    setResult(null); setPhase('game')
    const oppWpm = 40 + Math.floor(Math.random() * 35)
    const paraLen = p.length
    let oppChars = 0
    simRef.current = setInterval(() => {
      oppChars = Math.min(oppChars + Math.max(1, Math.round(oppWpm / 7)), paraLen)
      setP2Progress(oppChars / paraLen)
      if (oppChars >= paraLen) { clearInterval(simRef.current); setP2Done(true) }
    }, 500)
  }

  useEffect(() => {
    if (!p1Done && !p2Done) return
    clearInterval(simRef.current)
    const won = p1Done && !p2Done
    setResult({ won }); setPhase('result')
    playSound(won ? 'win' : 'game_over')
  }, [p1Done, p2Done])

  function playAgain() {
    clearInterval(simRef.current)
    if (lobbyTab === 'local') startLocalGame(); else startOnlineGame()
  }

  function quitToMenu() { clearInterval(simRef.current); onMenu() }

  // ── Lobby ─────────────────────────────
  if (phase === 'lobby') return (
    <div className="screen versus-screen">
      <div className="versus-lobby">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-back" onClick={onMenu}>← Back</button>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>⚔️ Versus Mode</h2>
        </div>

        <div className="lobby-tabs">
          <button className={`lobby-tab ${lobbyTab === 'local' ? 'active' : ''}`} id="tab-local" onClick={() => setLobbyTab('local')}>
            🖥️ Same Device
          </button>
          <button className={`lobby-tab ${lobbyTab === 'online' ? 'active' : ''}`} id="tab-online" onClick={() => setLobbyTab('online')}>
            🌐 Online
          </button>
        </div>

        {lobbyTab === 'local' && (
          <div className="lobby-panel">
            <p>Both players share this keyboard. Player 1 types on top, Player 2 on bottom. First to finish the paragraph wins.</p>
            <button className="btn-primary" id="btn-start-local" onClick={startLocalGame} style={{ marginTop: 8 }}>
              Start Local Match →
            </button>
          </div>
        )}

        {lobbyTab === 'online' && (
          <div className="lobby-panel" style={{ gap: 16 }}>
            {/* How it works */}
            <div className="offline-badge" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, textAlign: 'left' }}>
              <strong style={{ color: 'var(--yellow)', fontSize: 13 }}>ℹ️ How online versus works</strong>
              <span style={{ lineHeight: 1.5 }}>
                Currently your opponent is an <strong>AI simulation</strong> — no internet needed.
                To race a real friend on another device, both of you need to open this app
                and connect Supabase (free) in Settings. Then one creates a room, shares the
                6-letter code, and the other joins.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>Create a room</p>
              <button className="btn-primary" id="btn-create-room" onClick={createRoom}>
                Generate Room Code
              </button>
              {roomCode && isCreator && (
                <div className="room-code-box">
                  <span style={{ fontSize: 11, color: 'var(--dim)', letterSpacing: 1 }}>ROOM CODE — share with your friend</span>
                  <span className="room-code" id="room-code-display">{roomCode}</span>
                  <div className="waiting-row"><span className="pulse-dot" />Starting in a moment…</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>Join a room</p>
              <input id="join-code-input" className="code-input" type="text" maxLength={6} placeholder="TY4X2K"
                value={joinInput} onChange={e => setJoinInput(e.target.value.toUpperCase())} />
              <button className="btn-primary" id="btn-join-room" onClick={joinRoom}>Join Room →</button>
            </div>

            {statusMsg.text && (
              <p className={`status-msg ${statusMsg.type}`} id="status-msg">{statusMsg.text}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // ── Result ────────────────────────────
  if (phase === 'result') return (
    <div className="screen versus-screen">
      <div className="versus-lobby">
        <div className="overlay-box" style={{ animation: 'fadeIn 0.35s ease' }}>
          <h2 style={{ color: result?.won ? 'var(--green)' : 'var(--red)' }}>
            {result?.won ? '🏆 You Win!' : '😔 You Lose'}
          </h2>
          <p style={{ color: 'var(--dim)', marginBottom: 24 }}>
            {result?.won
              ? 'You finished the paragraph first! Great typing!'
              : 'Your opponent finished first. Keep practicing!'}
          </p>
          <div className="btn-row">
            <button className="btn-primary" id="btn-play-again" onClick={playAgain}>Play Again</button>
            <button className="btn-ghost"   id="btn-menu-result" onClick={quitToMenu}>Main Menu</button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Game ──────────────────────────────
  return (
    <div className="screen versus-game">
      <div className="versus-hud">
        <button className="btn-menu-hud" id="btn-versus-menu" onClick={quitToMenu}>
          ⬅ Menu
        </button>
        <span className="v-hud-title">
          ⚔️ VERSUS — {lobbyTab === 'online' ? `Room ${roomCode}` : 'Local Match'}
        </span>
        <span style={{ fontSize: 12, color: 'var(--mute)' }}>first to finish wins</span>
      </div>

      <TypingPanel para={para} onProgress={setP1Progress} onComplete={() => setP1Done(true)}
        disabled={p1Done} placeholder="Player 1 — start typing here…"
        label="PLAYER 1" labelClass="you" />

      <div className="race-track">
        <RaceTrack p1Progress={p1Progress} p2Progress={p2Progress} />
      </div>

      <TypingPanel para={para} onProgress={setP2Progress} onComplete={() => setP2Done(true)}
        disabled={lobbyTab === 'online' || p2Done}
        placeholder={lobbyTab === 'online' ? 'Opponent is typing…' : 'Player 2 — start typing here…'}
        label={lobbyTab === 'online' ? 'OPPONENT (AI)' : 'PLAYER 2'} labelClass="opp" />
    </div>
  )
}
