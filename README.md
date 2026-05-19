<p align="center">
  <img src="https://raw.githubusercontent.com/notavishek/TypeShooter/main/TypeShooterApp/src/assets/logo.png" alt="TypeShooter Logo" width="480" />
</p>

<p align="center">
  <strong>Type to survive.</strong> A space shooter where your keyboard is your only weapon — every correct keystroke fires a bullet at the alien fleet advancing toward your ship.
</p>

<p align="center">
  🌐 <strong><a href="https://type-shooter.vercel.app">type-shooter.vercel.app</a></strong>
</p>

---

## 🎮 What is TypeShooter?

TypeShooter is a browser-based typing game built with React + Vite. Instead of clicking or pressing arrow keys, you type — and the better you type, the better you survive. Aliens march toward your spaceship from the right side of the screen. Your job is to type the given paragraph accurately and quickly enough to shoot them all down before they reach you.

Miss too many and you lose a life. Lose all three and it's over.

---

## 🕹️ Game Modes

### 🎯 Normal Mode
Type one paragraph. When you finish, the game ends and you see a full breakdown of your performance — WPM, accuracy, errors, time, and a WPM-over-time graph. Choose your difficulty before starting.

| Difficulty | Alien Speed | Spawn Rate | Lives Needed |
|------------|-------------|------------|--------------|
| Easy       | Slow        | Every 4.5s | ~20 WPM      |
| Medium     | Moderate    | Every 1.8s | ~50 WPM      |
| Hard       | Fast        | Every 0.95s| ~80 WPM      |

### ♾️ Survival Mode
Paragraphs keep loading one after another. Aliens get progressively harder with each wave. Your goal is to survive as many waves as possible. The game ends only when you run out of lives.

### ⚔️ Versus Mode (Real-time Online)
Race a friend — anywhere in the world — over the same paragraph. First to finish wins.

**How to play with a friend:**
1. One player clicks **Create Room** → gets a 6-letter code (e.g. `KX7R2M`)
2. The other player opens the site → clicks **Join Room** → enters the code
3. Both players countdown together and type the same paragraph simultaneously
4. Progress bars update in real time — first to 100% wins 🏆

Powered by **Supabase Realtime** (websockets) — no server required beyond the free tier.

---

## 📊 Results Screen

After every Normal mode game or Survival game-over, you see:

- **WPM** — your final words per minute
- **Accuracy** — percentage of correct keystrokes
- **Errors** — total mistakes made
- **Time** — how long the paragraph took
- **WPM over time graph** — a canvas chart showing how your speed changed throughout the paragraph
- **Waves survived** (Survival mode only)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Game rendering | HTML5 Canvas API |
| Styling | Vanilla CSS (custom design system) |
| Real-time multiplayer | Supabase Realtime Broadcast |
| Hosting | Vercel |
| State management | React hooks (no Redux) |
| Audio | Procedural Web Audio API |

---

## 🏗️ Project Structure

```
TypeShooterApp/
├── src/
│   ├── components/
│   │   ├── MenuScreen.jsx       # Main menu with mode cards
│   │   ├── DifficultyScreen.jsx # Easy / Medium / Hard selector
│   │   ├── GameScreen.jsx       # Normal + Survival gameplay
│   │   ├── VersusScreen.jsx     # Real-time 1v1 multiplayer
│   │   └── LeaderboardScreen.jsx
│   ├── engine/
│   │   ├── GameEngine.js        # Canvas game loop, alien AI, bullets, particles
│   │   └── audio.js             # Procedural sound effects
│   ├── hooks/
│   │   └── useTypingEngine.js   # Typing state, WPM calc, accuracy tracking
│   ├── data/
│   │   ├── paragraphs.js        # 90 curated paragraphs across 3 difficulty tiers
│   │   └── leaderboard.js       # Local score persistence
│   ├── lib/
│   │   └── supabase.js          # Supabase client (for VS mode)
│   └── styles/
│       └── main.css             # Full design system
└── index.html
```

---

## ⚙️ How the Game Engine Works

1. **Alien spawning** — aliens appear off-screen right at a random Y position, then home toward the shooter's Y lane as they travel left. This keeps them visible and satisfying to shoot.
2. **Bullet firing** — every correct keystroke increments `pendingBullets`. The engine fires one bullet per pending count each frame, aimed at the nearest alien.
3. **Wave system** — after killing `waveSize` aliens, a wave completes and the next wave begins with tighter spawn timing.
4. **Difficulty scaling** — each wave in Survival mode tightens spawn intervals, making the game progressively harder over time.

---

## 💻 Running Locally

```bash
# Clone the repo
git clone https://github.com/notavishek/TypeShooter.git
cd TypeShooter/TypeShooterApp

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🚀 Deploying

The project is set up for **zero-config Vercel deployment**:

1. Fork this repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your fork
3. Set **Root Directory** to `TypeShooterApp`
4. Framework preset: **Vite** (auto-detected)
5. Click **Deploy**

Every `git push` to `main` auto-deploys.

---

## 🔌 Multiplayer Setup (Supabase)

The VS mode uses [Supabase Realtime](https://supabase.com/realtime) broadcast channels — **no database tables are required**.

To self-host with your own Supabase project:

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → API Keys** and copy your Project URL and publishable key
3. Replace the values in `src/lib/supabase.js`:

```js
export const supabase = createClient(
  'https://YOUR_PROJECT_REF.supabase.co',
  'YOUR_PUBLISHABLE_KEY'
)
```

4. No tables, no RLS rules needed — just the project existing is enough.

---

## 📝 Paragraph Pools

The 90 paragraphs are split into three tiers:

| Tier | Count | Avg Length | Used By |
|------|-------|-----------|---------|
| Easy | 25 | ~115 chars | Normal Easy, Survival |
| Medium | 35 | ~130 chars | Normal Medium, VS Mode |
| Hard | 30 | ~240 chars | Normal Hard |

Hard mode intentionally uses **long paragraphs** so the alien pressure has time to build — a 240-character paragraph takes ~3 minutes at 80 WPM and significantly longer at lower speeds, during which the alien spawn rate overwhelms slower typists.

---

## 🎨 Design

- Dark space theme with glassmorphism overlays
- Procedural star field background on the canvas
- Animated 3-2-1-GO! countdown before each game
- Real-time WPM tracking in the HUD
- Colour-coded typing feedback (correct = teal, wrong = red, cursor = white glow)
- Smooth particle explosions on alien kills

---

## 📄 License

MIT — do whatever you want with it.

---

*Built with React + Vite + Supabase + HTML5 Canvas*
