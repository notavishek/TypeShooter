/* ═══════════════════════════════════════════════
   TypeShooter — Canvas Game Engine
   Aliens spawn at random Y positions then HOME
   toward the shooter's lane as they travel left.
   This keeps them visible longer & feels great.
═══════════════════════════════════════════════ */

const DIFF_CFG = {
  //         speed px/s  spawnMs  HP  waveSize
  easy:     { alienSpeed: 28,   spawnMs: 4500, alienHp: 1, waveSize: 4  },
  medium:   { alienSpeed: 70,   spawnMs: 1800, alienHp: 2, waveSize: 7  },
  hard:     { alienSpeed: 145,  spawnMs: 950,  alienHp: 3, waveSize: 12 },
  survival: { alienSpeed: 55,   spawnMs: 2600, alienHp: 2, waveSize: 5  },
}

export class GameEngine {
  constructor(canvas, { mode, diff, onLifeLost, onGameOver, onWaveComplete }) {
    this.canvas = canvas
    this.ctx    = canvas.getContext('2d')
    this.mode   = mode
    this.diff   = diff
    this.cfg    = { ...DIFF_CFG[diff === 'survival' ? 'survival' : diff] }
    this.onLifeLost     = onLifeLost     || (() => {})
    this.onGameOver     = onGameOver     || (() => {})
    this.onWaveComplete = onWaveComplete || (() => {})

    // State
    this.lives   = 3
    this.wave    = 1
    this.score   = 0
    this.waveKills  = 0
    this.waveTarget = this.cfg.waveSize
    this.running = false
    this.currentWpm = 0
    this.lastKeyTime = 0   // track actual keystrokes for bullet fire
    this.pendingBullets = 0

    // Objects
    this.aliens    = []
    this.bullets   = []
    this.particles = []
    this.stars     = []
    this.shooter   = { x: 70, y: 0, flash: 0 }

    this._raf = null
    this._prevTs = 0
    this._spawnTimer  = 0
  }

  /* ── Public API ─────────────────────── */

  start() {
    this._resize()
    this._buildStars()
    this.running = true
    this._raf = requestAnimationFrame(ts => this._loop(ts))
    window.addEventListener('resize', this._onResize)
  }

  stop() {
    this.running = false
    if (this._raf) cancelAnimationFrame(this._raf)
    window.removeEventListener('resize', this._onResize)
  }

  /** Called once per correct keypress from the typing engine */
  onKeystroke(wpm) {
    this.currentWpm = wpm
    this.pendingBullets++   // one keystroke = one bullet
  }

  /* ── Loop ───────────────────────────── */

  _loop(ts) {
    if (!this.running) return
    const dt = Math.min((ts - this._prevTs) / 1000, 0.1)
    this._prevTs = ts
    this._update(dt, ts)
    this._draw()
    this._raf = requestAnimationFrame(t => this._loop(t))
  }

  _update(dt, ts) {
    /* Stars scroll */
    this.stars.forEach(s => {
      s.x -= s.speed
      if (s.x < 0) { s.x = this.W; s.y = Math.random() * this.H }
    })

    /* Spawn aliens */
    this._spawnTimer += dt * 1000
    const spawnMs = this.mode === 'normal'
      ? Math.max(600, this.cfg.spawnMs - (this.wave - 1) * 200)
      : this.cfg.spawnMs
    if (this._spawnTimer >= spawnMs) {
      this._spawnAlien()
      this._spawnTimer = 0
    }

    /* Fire bullets from keystrokes */
    while (this.pendingBullets > 0) {
      this._fireBullet()
      this.pendingBullets--
    }

    /* Bullet speed scales with WPM */
    const bSpeed = 420 + this.currentWpm * 3

    this.bullets = this.bullets.filter(b => {
      b.x += bSpeed * dt
      b.y += (b.vy || 0) * dt   // slight vertical drift toward target alien
      b.trail.push({ x: b.x, y: b.y })
      if (b.trail.length > 8) b.trail.shift()
      return b.x < this.W + 20
    })

    /* Alien speed */
    let aSpeed = this.cfg.alienSpeed
    if (this.mode === 'normal') aSpeed += (this.wave - 1) * 8

    this.aliens = this.aliens.filter(a => {
      a.x -= aSpeed * dt * a.speedMult

      /*
       * HOMING: alien gradually moves its Y toward the shooter's Y.
       * Progress 0→1 as alien crosses the screen right→left.
       * Starts homing after it's fully visible (~80% of screen width).
       */
      const screenProgress = 1 - (a.x / this.W)  // 0 at right edge, 1 at left
      const homeStrength   = Math.max(0, screenProgress - 0.15) * 0.08
      a.y += (this.shooter.y - a.y) * homeStrength

      // Small sine wobble on top of the homing
      a.wobble = Math.sin(Date.now() / 240 + a.phase) * (4 * (1 - screenProgress * 0.7))

      /* Reached shooter? */
      if (a.x < this.shooter.x + 24) {
        this._loseLife()
        this._explode(a.x, a.y, a.color)
        return false
      }

      /* Bullet hits — generous hitbox since bullet travels at shooter.y */
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b  = this.bullets[i]
        const dx = b.x - a.x
        const dy = b.y - (a.y + a.wobble)
        if (Math.abs(dx) < 28 && Math.abs(dy) < 28) {
          a.hp--
          this.bullets.splice(i, 1)
          this._hitPuff(b.x, b.y, a.color)
          if (a.hp <= 0) {
            this.score += 100 * this.wave
            this.waveKills++
            this._explode(a.x, a.y + a.wobble, a.color)
            if (this.mode !== 'survival' && this.waveKills >= this.waveTarget) {
              this._nextWave()
            }
            return false
          }
          break
        }
      }
      return true
    })

    /* Particles */
    this.particles = this.particles.filter(p => {
      p.x  += p.vx * dt
      p.y  += p.vy * dt
      p.vy += 55 * dt  // gravity
      p.life -= dt
      return p.life > 0
    })

    /* Shooter flash */
    if (this.shooter.flash > 0) this.shooter.flash -= dt * 4
  }

  /* ── Spawn ──────────────────────────── */

  _spawnAlien() {
    const hpBase = this.cfg.alienHp + Math.floor((this.wave - 1) / 2)
    const colors = ['#f472b6', '#fb923c', '#a78bfa', '#34d399', '#60a5fa', '#fbbf24']
    const color  = colors[Math.floor(Math.random() * colors.length)]
    const size   = 20 + Math.random() * 10

    /*
     * Aliens spawn at a RANDOM Y in the upper or lower 70% of the canvas
     * (avoiding dead center so the approach is visible).
     * They gradually HOME toward shooter.y as they travel across the screen,
     * lining up in front of the gun barrel by the time they get close.
     */
    const margin  = size + 10
    const spawnY  = margin + Math.random() * (this.H - margin * 2)

    this.aliens.push({
      x: this.W + 30,
      y: spawnY,
      wobble: 0,
      phase: Math.random() * Math.PI * 2,
      speedMult: 0.85 + Math.random() * 0.3,
      hp: hpBase, maxHp: hpBase,
      color, size,
    })
  }

  _fireBullet() {
    // Aim toward the nearest alien on screen; fall back to shooter.y
    let targetY = this.shooter.y
    let minDist = Infinity
    this.aliens.forEach(a => {
      const dist = Math.abs(a.x - this.shooter.x)
      if (dist < minDist) { minDist = dist; targetY = a.y + a.wobble }
    })
    // Small angle — bullet travels mostly right but slightly toward target
    const dx = this.W - this.shooter.x
    const dy = targetY - this.shooter.y
    const len = Math.hypot(dx, dy) || 1
    this.bullets.push({
      x:  this.shooter.x + 36,
      y:  this.shooter.y,
      vy: (dy / len) * 120,   // gentle vertical drift toward target
      trail: [],
    })
  }

  /* ── Game events ────────────────────── */

  _loseLife() {
    this.lives--
    this.shooter.flash = 1
    this.onLifeLost(this.lives)
    if (this.lives <= 0) {
      this.running = false
      this.onGameOver({ wave: this.wave, score: this.score })
    }
  }

  _nextWave() {
    this.wave++
    this.waveKills  = 0
    this.waveTarget = this.cfg.waveSize + (this.wave - 1) * 2
    this.onWaveComplete(this.wave)
  }

  /* ── Particles ──────────────────────── */

  _explode(x, y, color) {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20
      const speed = 70 + Math.random() * 130
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: 0.5 + Math.random() * 0.4,
        color, r: 2.5 + Math.random() * 3.5,
      })
    }
  }

  _hitPuff(x, y, color) {
    for (let i = 0; i < 7; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 1.2) * 80,
        life: 0.28,
        color, r: 2,
      })
    }
  }

  /* ── Draw ───────────────────────────── */

  _draw() {
    const { ctx: c, W, H } = this

    /* Background */
    c.fillStyle = '#07071a'
    c.fillRect(0, 0, W, H)

    /* Stars */
    this.stars.forEach(s => {
      c.globalAlpha = s.a
      c.fillStyle = '#fff'
      c.beginPath()
      c.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      c.fill()
    })
    c.globalAlpha = 1

    /* Shooter lane guide — subtle horizontal line */
    c.strokeStyle = 'rgba(108,99,255,0.12)'
    c.lineWidth   = 1
    c.setLineDash([10, 14])
    c.beginPath()
    c.moveTo(0, this.shooter.y)
    c.lineTo(W, this.shooter.y)
    c.stroke()
    c.setLineDash([])

    /* Bullets */
    this.bullets.forEach(b => {
      /* Trail */
      b.trail.forEach((t, i) => {
        c.globalAlpha = (i / b.trail.length) * 0.45
        c.fillStyle = '#fbbf24'
        c.beginPath()
        c.arc(t.x, t.y, 3.5 * (i / b.trail.length), 0, Math.PI * 2)
        c.fill()
      })
      c.globalAlpha = 1
      c.shadowBlur  = 14
      c.shadowColor = '#fbbf24'
      c.fillStyle   = '#fef3c7'
      c.beginPath()
      c.ellipse(b.x, b.y, 10, 4, 0, 0, Math.PI * 2)
      c.fill()
      c.shadowBlur = 0
    })

    /* Aliens */
    this.aliens.forEach(a => this._drawAlien(a))

    /* Particles */
    this.particles.forEach(p => {
      c.globalAlpha = Math.max(0, p.life / 0.6)
      c.fillStyle   = p.color
      c.shadowBlur  = 7
      c.shadowColor = p.color
      c.beginPath()
      c.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      c.fill()
    })
    c.globalAlpha = 1
    c.shadowBlur  = 0

    /* HP bars */
    this.aliens.filter(a => a.maxHp > 1).forEach(a => {
      const bw = 44, bh = 5
      const bx = a.x - bw / 2
      const by = a.y + a.wobble - a.size - 12
      c.fillStyle = 'rgba(0,0,0,0.65)'
      c.fillRect(bx, by, bw, bh)
      c.fillStyle = a.color
      c.fillRect(bx, by, bw * (a.hp / a.maxHp), bh)
    })

    /* Shooter */
    this._drawShooter()
  }

  _drawShooter() {
    const { ctx: c } = this
    const x = this.shooter.x
    const y = this.shooter.y
    c.save()
    if (this.shooter.flash > 0) c.globalAlpha = 0.45 + this.shooter.flash * 0.55

    // Main body
    c.fillStyle   = '#6c63ff'
    c.shadowBlur  = 18
    c.shadowColor = '#6c63ff'
    c.beginPath()
    c.moveTo(x - 22, y - 15)
    c.lineTo(x + 30, y)
    c.lineTo(x - 22, y + 15)
    c.lineTo(x - 10, y)
    c.closePath()
    c.fill()

    // Engine glow
    c.fillStyle   = '#a78bfa'
    c.shadowColor = '#a78bfa'
    c.shadowBlur  = 22
    c.beginPath()
    c.ellipse(x - 20, y, 7, 5, 0, 0, Math.PI * 2)
    c.fill()

    // Cockpit
    c.fillStyle  = '#e0f2fe'
    c.shadowBlur = 0
    c.beginPath()
    c.ellipse(x + 4, y, 7, 5, 0, 0, Math.PI * 2)
    c.fill()

    // Gun barrel
    c.fillStyle   = '#fbbf24'
    c.shadowColor = '#fbbf24'
    c.shadowBlur  = 10
    c.fillRect(x + 22, y - 2, 18, 4)
    c.shadowBlur  = 0
    c.restore()
  }

  _drawAlien(a) {
    const { ctx: c } = this
    const x = a.x
    const y = a.y + a.wobble
    c.save()
    c.shadowBlur  = 14
    c.shadowColor = a.color

    // Body
    c.fillStyle = a.color
    c.beginPath()
    c.ellipse(x, y, a.size, a.size * 0.65, 0, 0, Math.PI * 2)
    c.fill()

    // Eyes
    c.fillStyle  = '#080814'
    c.shadowBlur = 0
    c.beginPath()
    c.arc(x - a.size * 0.3, y - a.size * 0.12, a.size * 0.16, 0, Math.PI * 2)
    c.arc(x + a.size * 0.3, y - a.size * 0.12, a.size * 0.16, 0, Math.PI * 2)
    c.fill()

    // Eye shine
    c.fillStyle = '#fff'
    c.beginPath()
    c.arc(x - a.size * 0.28, y - a.size * 0.16, a.size * 0.05, 0, Math.PI * 2)
    c.arc(x + a.size * 0.32, y - a.size * 0.16, a.size * 0.05, 0, Math.PI * 2)
    c.fill()

    // Tentacles
    c.strokeStyle = a.color
    c.lineWidth   = 2.5
    c.shadowColor = a.color
    c.shadowBlur  = 7
    for (let i = 0; i < 5; i++) {
      const tx    = x - a.size * 0.9 + i * (a.size * 0.45)
      const phase = Date.now() / 280 + a.phase + i
      c.beginPath()
      c.moveTo(tx, y + a.size * 0.55)
      c.quadraticCurveTo(tx + Math.sin(phase) * 7, y + a.size + 6, tx, y + a.size * 1.25)
      c.stroke()
    }

    // Warning close to shooter
    if (a.x < this.W * 0.3) {
      c.fillStyle  = '#f87171'
      c.shadowBlur = 8
      c.font       = 'bold 13px Outfit, sans-serif'
      c.fillText('⚠', x - 7, y - a.size - 12)
    }
    c.restore()
  }

  /* ── Helpers ────────────────────────── */

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect()
    this.W = this.canvas.width  = rect.width  || window.innerWidth
    this.H = this.canvas.height = rect.height || 300
    /* Shooter sits vertically centered */
    this.shooter.x = 70
    this.shooter.y = this.H / 2
    this._buildStars()
  }

  _buildStars() {
    this.stars = []
    const n = Math.floor((this.W * this.H) / 5000)
    for (let i = 0; i < n; i++) {
      this.stars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.65 + 0.25,
        speed: Math.random() * 0.35 + 0.1,
      })
    }
  }

  get _onResize() {
    if (!this.__onResize) this.__onResize = () => this._resize()
    return this.__onResize
  }
}
