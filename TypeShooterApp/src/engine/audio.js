/* Web Audio API — all sounds procedurally generated, no audio files */

let _ctx = null
function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function tone(freq, gain, type, dur) {
  const ac  = getCtx()
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.type = type; osc.frequency.value = freq
  env.gain.setValueAtTime(gain, ac.currentTime)
  env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur)
  osc.connect(env); env.connect(ac.destination)
  osc.start(); osc.stop(ac.currentTime + dur)
}

function noise(gain, dur) {
  const ac  = getCtx()
  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate)
  const d   = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3
  const src = ac.createBufferSource(); src.buffer = buf
  const env = ac.createGain()
  env.gain.setValueAtTime(gain, ac.currentTime)
  env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur)
  src.connect(env); env.connect(ac.destination); src.start()
}

export function playSound(type) {
  try {
    switch (type) {
      case 'key':       tone(880, 0.04, 'square',   0.055); break
      case 'wrong':     noise(0.07, 0.08); break
      case 'shoot': {
        const ac = getCtx(), o = ac.createOscillator(), e = ac.createGain()
        o.type = 'sawtooth'
        o.frequency.setValueAtTime(420, ac.currentTime)
        o.frequency.exponentialRampToValueAtTime(90, ac.currentTime + 0.1)
        e.gain.setValueAtTime(0.15, ac.currentTime)
        e.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1)
        o.connect(e); e.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.12)
        break
      }
      case 'explode':   noise(0.3, 0.22); tone(100, 0.18, 'sawtooth', 0.22); break
      case 'life_lost': [400,300,200].forEach((f,i) => setTimeout(() => tone(f,0.2,'square',0.14), i*90)); break
      case 'wave':      [300,420,620].forEach((f,i) => setTimeout(() => tone(f,0.18,'sine',0.14),  i*90)); break
      case 'game_over': [500,350,200,140].forEach((f,i) => setTimeout(() => tone(f,0.22,'sawtooth',0.18), i*140)); break
      case 'win':       [400,500,650,800,1050].forEach((f,i) => setTimeout(() => tone(f,0.18,'sine',0.18), i*75)); break
    }
  } catch(_) {}
}
