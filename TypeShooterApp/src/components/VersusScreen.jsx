import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { getParagraph } from '../data/paragraphs.js'
import { useTypingEngine } from '../hooks/useTypingEngine.js'
import { playSound } from '../engine/audio.js'

/* ── Helpers ──────────────────────────────────────────────── */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const genCode = () => Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
const genId   = () => Math.random().toString(36).slice(2, 10)
const MY_ID   = genId()  // stable for this browser session

/* ── Sub-screens ──────────────────────────────────────────── */

function LobbyUI({ onCreate, joinCode, setJoinCode, onJoin, joinError, onMenu }) {
  return (
    <div className="screen menu-screen">
      <div className="menu-bg" />
      <div className="menu-content" style={{ gap: 24, maxWidth: 480 }}>
        <button className="btn-back" onClick={onMenu}>⬅ Back</button>

        <div className="logo" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 40 }}>⚔️</div>
          <div className="logo-title" style={{ fontSize: 42 }}>
            VS <span>Mode</span>
          </div>
          <div className="logo-sub">Real-time 1v1 — same network or anywhere in the world</div>
        </div>

        {/* Create Room */}
        <button
          id="btn-create-room"
          className="btn-primary"
          style={{ width: '100%', fontSize: 17, padding: '16px 0' }}
          onClick={onCreate}
        >
          🎮 Create Room
        </button>

        {/* Join Room */}
        <div style={{
          width: '100%', background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px',
        }}>
          <div style={{ fontSize: 13, color: 'var(--dim)', marginBottom: 10, fontWeight: 600 }}>
            Join a friend's room
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              id="join-code-input"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && onJoin()}
              placeholder="ROOM CODE"
              style={{
                flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '11px 16px', color: '#fff',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 18,
                letterSpacing: 4, textTransform: 'uppercase', textAlign: 'center',
                outline: 'none',
              }}
            />
            <button
              id="btn-join-room"
              className="btn-primary"
              style={{ padding: '11px 22px', fontSize: 15 }}
              onClick={onJoin}
            >
              Join
            </button>
          </div>
          {joinError && (
            <div style={{ marginTop: 8, color: '#f87171', fontSize: 13 }}>{joinError}</div>
          )}
        </div>

        <div style={{
          fontSize: 12, color: 'var(--dim)', textAlign: 'center', lineHeight: 1.7,
          padding: '0 8px',
        }}>
          Share the 6-letter code with a friend. Works across devices, anywhere in the world.
          Both players type the <strong style={{ color: 'var(--primary2)' }}>same paragraph</strong> — first to finish wins.
        </div>
      </div>
    </div>
  )
}

function WaitingUI({ role, roomCode, onMenu }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="screen menu-screen">
      <div className="menu-bg" />
      <div className="menu-content" style={{ gap: 28, maxWidth: 420 }}>
        <button className="btn-back" onClick={onMenu}>⬅ Back</button>

        {role === 'host' ? (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Room Created!</div>
              <div style={{ fontSize: 13, color: 'var(--dim)' }}>
                Share this code with your friend
              </div>
            </div>

            <div
              id="room-code-display"
              style={{
                fontSize: 52, fontWeight: 900, letterSpacing: 10,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--primary2)',
                textShadow: '0 0 30px rgba(167,139,250,0.5)',
                textAlign: 'center',
                cursor: 'pointer',
                padding: '18px 24px',
                background: 'rgba(108,99,255,0.1)',
                border: '2px solid rgba(108,99,255,0.3)',
                borderRadius: 16,
              }}
              onClick={copy}
            >
              {roomCode}
            </div>

            <button className="btn-ghost" onClick={copy} style={{ width: '100%' }}>
              {copied ? '✅ Copied!' : '📋 Copy Code'}
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              color: 'var(--dim)', fontSize: 13,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#facc15',
                boxShadow: '0 0 8px #facc15',
                animation: 'pulse 1.2s ease infinite',
              }} />
              Waiting for opponent to join…
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔌</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Joining Room</div>
              <div style={{
                fontSize: 32, fontWeight: 900, letterSpacing: 8,
                fontFamily: 'JetBrains Mono', color: 'var(--primary2)', margin: '12px 0',
              }}>{roomCode}</div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              color: 'var(--dim)', fontSize: 13, justifyContent: 'center',
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#34d399',
                boxShadow: '0 0 8px #34d399',
                animation: 'pulse 1.2s ease infinite',
              }} />
              Connected — waiting for host to start…
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RaceTrack({ myProgress, opponentProgress, myWpm, opponentWpm }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '20px 24px', marginBottom: 16,
    }}>
      {/* Me */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: 'var(--primary2)', fontWeight: 700 }}>🚀 You</span>
          <span style={{ color: 'var(--dim)', fontFamily: 'JetBrains Mono' }}>{myWpm} WPM · {myProgress}%</span>
        </div>
        <div style={{
          height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 99,
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            width: `${myProgress}%`, height: '100%',
            background: 'linear-gradient(90deg, var(--primary), var(--primary2))',
            borderRadius: 99, transition: 'width 0.3s ease',
            boxShadow: '0 0 12px rgba(108,99,255,0.6)',
          }} />
        </div>
      </div>

      {/* Opponent */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: '#f87171', fontWeight: 700 }}>🛸 Opponent</span>
          <span style={{ color: 'var(--dim)', fontFamily: 'JetBrains Mono' }}>{opponentWpm} WPM · {opponentProgress}%</span>
        </div>
        <div style={{
          height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 99,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${opponentProgress}%`, height: '100%',
            background: 'linear-gradient(90deg, #ef4444, #f97316)',
            borderRadius: 99, transition: 'width 0.4s ease',
            boxShadow: '0 0 12px rgba(239,68,68,0.5)',
          }} />
        </div>
      </div>
    </div>
  )
}

/* ── Main VersusScreen ────────────────────────────────────── */
export default function VersusScreen({ onMenu }) {
  // phase: lobby | waiting | countdown | playing | finished
  const [phase, setPhase]               = useState('lobby')
  const [role, setRole]                 = useState(null)        // 'host'|'guest'
  const [roomCode, setRoomCode]         = useState('')
  const [joinCode, setJoinCode]         = useState('')
  const [joinError, setJoinError]       = useState('')
  const [countdown, setCountdown]       = useState(null)
  const [myProgress, setMyProgress]     = useState(0)
  const [oppProgress, setOppProgress]   = useState(0)
  const [oppWpm, setOppWpm]             = useState(0)
  const [result, setResult]             = useState(null)        // { winner, myWpm, oppWpm, myTime, oppTime }

  const channelRef    = useRef(null)
  const gameStartRef  = useRef(null)
  const myProgRef     = useRef(0)
  const finishedRef   = useRef(false)
  const inputRef      = useRef(null)
  const countdownTimerRef = useRef(null)
  // guest retry for player_join
  const joinRetryRef  = useRef(null)

  const onKeystroke = useCallback(() => {}, [])
  const typing = useTypingEngine(onKeystroke)

  /* ── Cleanup ── */
  function cleanup() {
    clearInterval(countdownTimerRef.current)
    clearInterval(joinRetryRef.current)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }
  useEffect(() => () => cleanup(), [])

  /* ── Broadcast progress on every keystroke ── */
  useEffect(() => {
    if (phase !== 'playing') return
    const correct = typing.charStates.filter(c => c.state === 'correct').length
    const total   = typing.text.length || 1
    const pct     = Math.round((correct / total) * 100)
    myProgRef.current = pct
    setMyProgress(pct)
    channelRef.current?.send({
      type: 'broadcast', event: 'progress',
      payload: { id: MY_ID, wpm: typing.wpm, progress: pct },
    })
  }, [typing.cursor, typing.wpm, phase])  // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Detect paragraph completion ── */
  useEffect(() => {
    if (phase !== 'playing' || !typing.done || finishedRef.current) return
    finishedRef.current = true
    const elapsed = Date.now() - (gameStartRef.current || Date.now())
    playSound('win')
    channelRef.current?.send({
      type: 'broadcast', event: 'finished',
      payload: { id: MY_ID, wpm: typing.wpm, timeMs: elapsed },
    })
    setResult(r => ({
      winner: 'me',
      myWpm: typing.wpm, myTime: elapsed,
      oppWpm: r?.oppWpm ?? oppWpm, oppTime: r?.oppTime ?? null,
    }))
    setPhase('finished')
  }, [typing.done])  // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Countdown helper ── */
  function runCountdown(para) {
    typing.reset(para)
    if (inputRef.current) inputRef.current.value = ''
    finishedRef.current = false
    setMyProgress(0); setOppProgress(0); myProgRef.current = 0
    setPhase('countdown')
    let n = 3
    setCountdown(n)
    countdownTimerRef.current = setInterval(() => {
      n--
      if (n > 0) {
        setCountdown(n)
      } else {
        clearInterval(countdownTimerRef.current)
        setCountdown('GO!')
        setTimeout(() => {
          setCountdown(null)
          gameStartRef.current = Date.now()
          setPhase('playing')
          setTimeout(() => inputRef.current?.focus(), 50)
        }, 650)
      }
    }, 1000)
  }

  /* ── Build & subscribe to Supabase Realtime channel ── */
  function buildChannel(code, onSubscribed) {
    const channel = supabase.channel(`typeshooter:${code}`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'game_start' }, ({ payload }) => {
        // Both host and guest receive this (guest via host broadcast)
        clearInterval(joinRetryRef.current)
        runCountdown(payload.paragraph)
      })
      .on('broadcast', { event: 'player_join' }, ({ payload }) => {
        // Host receives when guest joins → send game_start
        if (payload.id !== MY_ID) {
          const para = getParagraph('medium')
          channel.send({
            type: 'broadcast', event: 'game_start',
            payload: { paragraph: para },
          })
          // Host also starts countdown (it won't receive its own broadcast)
          runCountdown(para)
        }
      })
      .on('broadcast', { event: 'progress' }, ({ payload }) => {
        if (payload.id !== MY_ID) {
          setOppProgress(payload.progress)
          setOppWpm(payload.wpm)
        }
      })
      .on('broadcast', { event: 'finished' }, ({ payload }) => {
        if (payload.id === MY_ID) return
        setResult(r => {
          const oppWpmVal = payload.wpm
          const oppTimeVal = payload.timeMs
          if (!finishedRef.current) {
            // Opponent finished first
            finishedRef.current = true
            setPhase('finished')
            return {
              winner: 'opponent',
              myWpm: typing.wpm, myTime: null,
              oppWpm: oppWpmVal, oppTime: oppTimeVal,
            }
          }
          // I already finished — just add their time
          return { ...r, oppWpm: oppWpmVal, oppTime: oppTimeVal }
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onSubscribed(channel)
      })

    return channel
  }

  /* ── Create Room ── */
  function handleCreate() {
    const code = genCode()
    setRoomCode(code)
    setRole('host')
    setPhase('waiting')
    buildChannel(code, (ch) => { channelRef.current = ch })
  }

  /* ── Join Room ── */
  function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) { setJoinError('Enter the 6-letter room code'); return }
    setJoinError('')
    setRoomCode(code)
    setRole('guest')
    setPhase('waiting')

    buildChannel(code, (ch) => {
      channelRef.current = ch
      // Send player_join immediately and retry every 1.5s until game_start arrives
      function sendJoin() {
        ch.send({ type: 'broadcast', event: 'player_join', payload: { id: MY_ID } })
      }
      sendJoin()
      joinRetryRef.current = setInterval(sendJoin, 1500)
    })
  }

  /* ── Restart ── */
  function handleRematch() {
    cleanup()
    setPhase('lobby')
    setResult(null)
    setMyProgress(0); setOppProgress(0); setOppWpm(0)
    setCountdown(null); finishedRef.current = false
    typing.reset('')
    if (inputRef.current) inputRef.current.value = ''
  }

  /* ── Render: Lobby ── */
  if (phase === 'lobby') {
    return (
      <LobbyUI
        onCreate={handleCreate}
        joinCode={joinCode} setJoinCode={setJoinCode}
        onJoin={handleJoin} joinError={joinError}
        onMenu={onMenu}
      />
    )
  }

  /* ── Render: Waiting ── */
  if (phase === 'waiting') {
    return (
      <WaitingUI
        role={role} roomCode={roomCode}
        onMenu={() => { cleanup(); onMenu() }}
      />
    )
  }

  /* ── Render: Countdown + Playing ── */
  if (phase === 'countdown' || phase === 'playing') {
    return (
      <div className="screen game-screen">
        {/* Minimal HUD */}
        <div className="hud">
          <div className="hud-group">
            <span className="hud-label">WPM</span>
            <span className="hud-val" id="hud-wpm-vs">{typing.wpm}</span>
          </div>
          <div className="hud-center">
            <span className="hud-mode">VS MODE · {roomCode}</span>
          </div>
          <div className="hud-group">
            <span className="hud-label">ERR</span>
            <span className="hud-val" style={{ color: '#f87171' }}>{typing.errors}</span>
            <button className="btn-menu-hud" style={{ marginLeft: 16 }}
              onClick={() => { cleanup(); onMenu() }}>⬅ Menu</button>
          </div>
        </div>

        {/* Race area (takes canvas-wrap space) */}
        <div className="canvas-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '90%', maxWidth: 640 }}>
            <RaceTrack
              myProgress={myProgress}
              opponentProgress={oppProgress}
              myWpm={typing.wpm}
              opponentWpm={oppWpm}
            />
          </div>

          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="countdown-overlay" id="countdown-overlay-vs">
              <span key={countdown} className={`countdown-num ${countdown === 'GO!' ? 'countdown-go' : ''}`}>
                {countdown}
              </span>
            </div>
          )}
        </div>

        {/* Typing area */}
        <div className="typing-area">
          <div className="para-display" id="para-display-vs">
            {typing.charStates.map((c, i) => (
              <span key={i} className={`ch ${
                c.state === 'correct' ? 'ok' : c.state === 'wrong' ? 'err' : c.state === 'current' ? 'cur' : ''
              }`}>{c.ch}</span>
            ))}
          </div>
          <input
            id="vs-typing-input" ref={inputRef}
            className="typing-input" type="text"
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            placeholder="Type to race your opponent…"
            onChange={typing.onInput}
            disabled={phase === 'countdown'}
          />
          <div className="typing-meta">
            <span>{typing.charStates.filter(c => c.state === 'correct').length} / {typing.text.length} chars</span>
            <span>{typing.errors} errors</span>
            <span>🔥 {typing.streak} streak</span>
          </div>
        </div>
      </div>
    )
  }

  /* ── Render: Finished ── */
  if (phase === 'finished' && result) {
    const iWon = result.winner === 'me'
    return (
      <div className="screen menu-screen">
        <div className="menu-bg" />
        <div className="menu-content" style={{ gap: 24, maxWidth: 520 }}>
          {/* Winner banner */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{iWon ? '🏆' : '💀'}</div>
            <h2 style={{
              fontSize: 36, fontWeight: 900, margin: 0,
              color: iWon ? '#fbbf24' : '#f87171',
              textShadow: iWon ? '0 0 30px rgba(251,191,36,0.5)' : '0 0 30px rgba(248,113,113,0.5)',
            }}>
              {iWon ? 'You Win!' : 'Opponent Wins'}
            </h2>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            width: '100%',
          }}>
            {[
              { label: '🚀 Your WPM', value: result.myWpm, highlight: iWon },
              { label: '🛸 Opp WPM',  value: result.oppWpm ?? '—', highlight: !iWon },
              { label: '⏱ Your Time', value: result.myTime ? `${(result.myTime/1000).toFixed(1)}s` : '—', highlight: false },
              { label: '⏱ Opp Time',  value: result.oppTime ? `${(result.oppTime/1000).toFixed(1)}s` : '—', highlight: false },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${highlight ? 'rgba(108,99,255,0.4)' : 'var(--border)'}`,
                borderRadius: 12, padding: '16px 20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: 'var(--dim)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{
                  fontSize: 36, fontWeight: 800, fontFamily: 'JetBrains Mono',
                  color: highlight ? 'var(--primary2)' : '#fff',
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-primary" id="btn-vs-rematch" onClick={handleRematch}>
              🔁 New Game
            </button>
            <button className="btn-ghost" id="btn-vs-menu" onClick={() => { cleanup(); onMenu() }}>
              Main Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
