import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import './WinnersPage.css'

export default function WinnersPage() {
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    api.get('/draws')
      .then(({ data }) => {
        const published = (data.draws || []).filter(d => d.status === 'published')
        setDraws(published)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="section winners-page">
      <div className="container">
        
        <div className="winners-hero text-center mb-2xl">
          <span className="section-tag">Past Results</span>
          <h1 className="mb-md">Monthly Prize Winners</h1>
          <p className="text-muted" style={{maxWidth: 600, margin: '0 auto'}}>
            Check the latest draw results and see how the prize pools were distributed.
          </p>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : draws.length === 0 ? (
          <div className="text-center text-muted mt-xl">
            <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🎯</div>
            <h2>No draws have been published yet.</h2>
            <p className="mt-md">Check back after the first of next month!</p>
            <Link to="/subscribe" className="btn btn-primary mt-lg">Get Ready for the Next Draw</Link>
          </div>
        ) : (
          <div className="draws-list">
            {draws.map(draw => {
              const pool = draw.prize_pools?.[0] || {}
              return (
                <div key={draw.id} className="draw-result-card card mb-xl">
                  <div className="draw-result-card__header flex-between">
                    <div>
                      <h2>{draw.month} Draw</h2>
                      <p className="text-muted text-sm mt-sm">Published on {new Date(draw.published_at).toLocaleDateString()}</p>
                    </div>
                    <div className="winning-numbers-display">
                      <span className="text-xs text-uppercase text-muted block mb-sm text-center">Winning Numbers</span>
                      <div className="flex gap-sm">
                        {draw.draw_numbers?.map((num, i) => (
                          <div key={i} className="winning-number">{num}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="draw-result-card__body mt-xl">
                    <div className="prize-tiers-result grid-3 mb-lg">
                      
                      {}
                      <div className="tier-result-card">
                        <div className="tier-header flex-between mb-md">
                          <span className="font-heading font-bold text-gold">5-Match</span>
                          <span className="badge badge-gold">Jackpot</span>
                        </div>
                        <div className="tier-amount text-gold">
                          £{(pool.jackpot_pool || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </div>
                        {draw.jackpot_rolled ? (
                          <div className="tier-status mt-sm text-muted text-sm">
                            No winners. Rolled over!
                          </div>
                        ) : (
                          <div className="tier-status mt-sm text-sm">
                            Won and distributed!
                          </div>
                        )}
                      </div>

                      {}
                      <div className="tier-result-card">
                        <div className="tier-header flex-between mb-md">
                          <span className="font-heading font-bold">4-Match</span>
                          <span className="badge badge-primary">Silver</span>
                        </div>
                        <div className="tier-amount">
                          £{(pool.four_match_pool || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </div>
                        <div className="tier-status mt-sm text-sm">
                          Distributed to winners
                        </div>
                      </div>

                      {}
                      <div className="tier-result-card">
                        <div className="tier-header flex-between mb-md">
                          <span className="font-heading font-bold">3-Match</span>
                          <span className="badge badge-primary">Bronze</span>
                        </div>
                        <div className="tier-amount">
                          £{(pool.three_match_pool || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </div>
                        <div className="tier-status mt-sm text-sm">
                          Distributed to winners
                        </div>
                      </div>

                    </div>
                    
                    <div className="draw-summary-bar flex-between text-sm text-muted">
                      <span>Total Prize Pool: <strong className="text-primary-light">£{(pool.total_pool || 0).toLocaleString()}</strong></span>
                      <span>Rolled from previous: £{(pool.rolled_jackpot || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
