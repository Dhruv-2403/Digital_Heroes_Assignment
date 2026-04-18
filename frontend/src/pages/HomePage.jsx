import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import api from '../lib/api'
import './HomePage.css'

function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

function StatCard({ value, label, prefix = '', suffix = '' }) {
  const count = useCounter(value)
  return (
    <div className="stat-card">
      <div className="stat-card__value">{prefix}{count.toLocaleString()}{suffix}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  )
}

function Step({ number, title, description, icon }) {
  return (
    <div className="step-card">
      <div className="step-card__number">{number}</div>
      <div className="step-card__icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function CharityCard({ charity }) {
  return (
    <Link to={`/charities/${charity.id}`} className="charity-spotlight-card">
      <div className="charity-spotlight-card__img">
        {charity.image_url
          ? <img src={charity.image_url} alt={charity.name} />
          : <div className="charity-spotlight-card__placeholder">🤝</div>}
      </div>
      <div className="charity-spotlight-card__body">
        <span className="badge badge-primary">Featured</span>
        <h4>{charity.name}</h4>
        <p>{charity.description?.slice(0, 90)}...</p>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const [featuredCharities, setFeaturedCharities] = useState([])

  useEffect(() => {
    api.get('/charities?featured=true')
      .then(({ data }) => setFeaturedCharities(data.charities || []))
      .catch(() => {})
  }, [])

  return (
    <div className="home">

      <section className="hero">
        {}
        <div className="glow-orb hero__orb1" />
        <div className="glow-orb hero__orb2" />

        <div className="container hero__content">
          <div className="hero__badge">
            <span className="badge badge-primary">🏆 Monthly Prize Draws</span>
          </div>

          <h1 className="hero__headline">
            Play Golf.<br />
            <span className="hero__headline--gold">Win Big.</span><br />
            Change Lives.
          </h1>

          <p className="hero__sub">
            Track your Stableford scores, enter monthly prize draws, and
            automatically donate to the charity you love — all in one platform
            built for golfers who give back.
          </p>

          <div className="hero__cta">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Start Your Journey →
            </Link>
            <Link to="/charities" className="btn btn-outline btn-lg">
              Explore Charities
            </Link>
          </div>

          {}
          <div className="hero__stats">
            <StatCard value={1240} label="Active Players" />
            <StatCard value={48500} label="Raised for Charity" prefix="£" />
            <StatCard value={36} label="Monthly Draws" />
            <StatCard value={5} label="Charities Supported" />
          </div>
        </div>

        {}
        <div className="hero__mockup">
          <div className="mockup-card">
            <div className="mockup-card__header">🏌️ My Scores</div>
            {[
              { date: 'Apr 14', score: 38, flag: '🟢' },
              { date: 'Apr 07', score: 34, flag: '🟡' },
              { date: 'Mar 30', score: 41, flag: '🟢' },
              { date: 'Mar 22', score: 29, flag: '🔴' },
              { date: 'Mar 15', score: 36, flag: '🟡' },
            ].map((s, i) => (
              <div key={i} className="mockup-card__row">
                <span className="mockup-card__date">{s.date}</span>
                <span className="mockup-card__score">{s.score} pts</span>
                <span>{s.flag}</span>
              </div>
            ))}
            <div className="mockup-card__draw">
              🎯 Next Draw: <strong>May 1st</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section how-it-works">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Simple Process</span>
            <h2>How Digital Heroes Works</h2>
            <p>Four steps to play, contribute, and win</p>
          </div>

          <div className="steps-grid">
            <Step number="01" icon="📋" title="Subscribe"
              description="Choose monthly or yearly. A portion of every subscription goes directly to your chosen charity." />
            <Step number="02" icon="🏌️" title="Enter Your Scores"
              description="Log your latest 5 Stableford scores (1–45 pts). Your rolling score history becomes your draw ticket." />
            <Step number="03" icon="🎲" title="Monthly Draw"
              description="Our algorithm generates 5 winning numbers each month. Match 3, 4 or all 5 to win your share of the prize pool." />
            <Step number="04" icon="❤️" title="Give Back"
              description="A minimum 10% of your subscription automatically goes to the charity you selected — you can give more." />
          </div>
        </div>
      </section>

      <section className="section prize-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Win Every Month</span>
            <h2>Prize Pool Breakdown</h2>
            <p>Every active subscriber contributes to the prize pool. No winner? The jackpot rolls over.</p>
          </div>

          <div className="prize-tiers">
            <div className="prize-tier prize-tier--jackpot">
              <div className="prize-tier__icon">🏆</div>
              <div className="prize-tier__match">5-Number Match</div>
              <div className="prize-tier__pct">40% of pool</div>
              <div className="prize-tier__label">JACKPOT — Rolls Over</div>
            </div>
            <div className="prize-tier">
              <div className="prize-tier__icon">🥈</div>
              <div className="prize-tier__match">4-Number Match</div>
              <div className="prize-tier__pct">35% of pool</div>
              <div className="prize-tier__label">Silver Prize</div>
            </div>
            <div className="prize-tier">
              <div className="prize-tier__icon">🥉</div>
              <div className="prize-tier__match">3-Number Match</div>
              <div className="prize-tier__pct">25% of pool</div>
              <div className="prize-tier__label">Bronze Prize</div>
            </div>
          </div>

          <div className="text-center mt-xl">
            <Link to="/signup" className="btn btn-gold btn-lg">Join & Enter Next Draw →</Link>
          </div>
        </div>
      </section>

      {featuredCharities.length > 0 && (
        <section className="section charities-section">
          <div className="container">
            <div className="section-header flex-between mb-xl">
              <div>
                <span className="section-tag">Impact</span>
                <h2>Featured Charities</h2>
              </div>
              <Link to="/charities" className="btn btn-outline btn-sm">View All →</Link>
            </div>

            <div className="charity-spotlight-grid">
              {featuredCharities.map(c => <CharityCard key={c.id} charity={c} />)}
            </div>
          </div>
        </section>
      )}

      <section className="section cta-section">
        <div className="container">
          <div className="cta-block">
            <div className="glow-orb cta-orb" />
            <span className="section-tag">Ready?</span>
            <h2>Your next round could change everything</h2>
            <p>Subscribe today and start turning your golf game into good.</p>
            <div className="flex-center gap-md mt-xl">
              <Link to="/signup" className="btn btn-primary btn-lg">Get Started — Free Trial</Link>
              <Link to="/winners" className="btn btn-outline btn-lg">See Past Winners</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
