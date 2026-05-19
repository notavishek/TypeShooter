import { useEffect, useRef } from 'react'
import logoImg from '../assets/logo.png'

export default function MenuScreen({ onNormal, onSurvival, onVersus, onLeaderboard }) {
  const canvasRef = useRef(null)

  /* Animated starfield + shooting stars */
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W, H, particles = [], shootingStars = [], raf

    const resize = () => {
      W = canvas.width  = canvas.parentElement.offsetWidth  || window.innerWidth
      H = canvas.height = canvas.parentElement.offsetHeight || window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.4,
        col: ['#6c63ff','#a78bfa','#f472b6','#34d399','#60a5fa'][Math.floor(Math.random()*5)],
        a: Math.random() * 0.6 + 0.2,
      })
    }

    const starTimer = setInterval(() => {
      shootingStars.push({
        x: Math.random() * W * 0.5, y: Math.random() * H * 0.4,
        len: 90 + Math.random() * 100,
        speed: 320 + Math.random() * 180, alpha: 1,
      })
    }, 2200)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const grd = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2, Math.max(W,H)*0.7)
      grd.addColorStop(0, '#12122a'); grd.addColorStop(1, '#060610')
      ctx.fillStyle = grd; ctx.fillRect(0,0,W,H)

      shootingStars = shootingStars.filter(s => {
        s.x += s.speed * 0.016; s.y += s.speed * 0.007; s.alpha -= 0.018
        if (s.alpha <= 0) return false
        ctx.globalAlpha = s.alpha
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.len*0.7, s.y - s.len*0.35)
        g.addColorStop(0,'#fff'); g.addColorStop(1,'transparent')
        ctx.strokeStyle = g; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x-s.len*0.7, s.y-s.len*0.35); ctx.stroke()
        return true
      })

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.globalAlpha = p.a
        ctx.fillStyle = p.col; ctx.shadowBlur = 8; ctx.shadowColor = p.col
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill()
      })
      ctx.globalAlpha = 1; ctx.shadowBlur = 0
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(starTimer)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="screen menu-screen">
      <div className="menu-bg"><canvas ref={canvasRef} /></div>
      <div className="menu-content">
        <div className="logo">
          <img
            src={logoImg}
            alt="TypeShooter icon"
            style={{
              width: 180,
              maxWidth: '50vw',
              height: 'auto',
              marginBottom: 10,
              filter: 'drop-shadow(0 0 32px rgba(59,185,255,0.8))',
            }}
          />
          <h1 className="logo-title">
            Type<span>Shooter</span>
          </h1>
          <p className="logo-sub">Your words are your weapons</p>
        </div>

        <div className="menu-modes">
          <button className="mode-card" id="btn-normal" onClick={onNormal}>
            <span className="mode-icon">🎯</span>
            <div className="mode-info">
              <h2>Normal Mode</h2>
              <p>Survive alien waves — Easy, Medium or Hard</p>
            </div>
            <span className="mode-arrow">→</span>
          </button>
          <button className="mode-card" id="btn-survival" onClick={onSurvival}>
            <span className="mode-icon">♾️</span>
            <div className="mode-info">
              <h2>Survival Mode</h2>
              <p>Endless waves — how many characters can you type cleanly?</p>
            </div>
            <span className="mode-arrow">→</span>
          </button>
          <button className="mode-card" id="btn-versus" onClick={onVersus}>
            <span className="mode-icon">⚔️</span>
            <div className="mode-info">
              <h2>Versus Mode</h2>
              <p>Race a friend — same paragraph, first to finish wins</p>
            </div>
            <span className="mode-arrow">→</span>
          </button>
        </div>

        <div className="menu-footer">
          <button className="btn-ghost" id="btn-leaderboard" onClick={onLeaderboard}>🏆 Leaderboard</button>
        </div>
      </div>
    </div>
  )
}
