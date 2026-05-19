export default function DifficultyScreen({ onSelect, onBack }) {
  return (
    <div className="screen difficulty-screen">
      <div className="sub-wrap">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h2 className="sub-title">Choose Difficulty</h2>
        <div className="diff-cards">
          <button className="diff-card easy" id="btn-easy" onClick={() => onSelect('easy')}>
            <span className="diff-tag">EASY</span>
            <span className="diff-wpm">~30 WPM</span>
            <span className="diff-desc">Slow aliens · Forgiving pace · Great for beginners</span>
          </button>
          <button className="diff-card medium" id="btn-medium" onClick={() => onSelect('medium')}>
            <span className="diff-tag">MEDIUM</span>
            <span className="diff-wpm">~60 WPM</span>
            <span className="diff-desc">Standard speed · Steady challenge · Test your skills</span>
          </button>
          <button className="diff-card hard" id="btn-hard" onClick={() => onSelect('hard')}>
            <span className="diff-tag">HARD</span>
            <span className="diff-wpm">100+ WPM</span>
            <span className="diff-desc">Elite typists only · Ruthless pace · No mercy</span>
          </button>
        </div>
      </div>
    </div>
  )
}
