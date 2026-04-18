import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const [scores, setScores] = useState([])
  const [winnings, setWinnings] = useState([])
  const [loading, setLoading] = useState(true)

  const [scoreInput, setScoreInput] = useState('')
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0])
  const [scoreError, setScoreError] = useState('')
  const [submittingScore, setSubmittingScore] = useState(false)

  const activeSub = user?.subscriptions?.find(s => s.status === 'active')

  useEffect(() => {
    if (!activeSub) {
      setLoading(false)
      return
    }

    Promise.all([
      api.get('/scores').catch(() => ({ data: { scores: [] } })),
      api.get('/winners/my').catch(() => ({ data: { winners: [] } }))
    ]).then(([scoresRes, winningsRes]) => {
      setScores(scoresRes.data.scores || [])
      setWinnings(winningsRes.data.winners || [])
      setLoading(false)
    })
  }, [activeSub])

  const handleScoreSubmit = async (e) => {
    e.preventDefault()
    setScoreError('')
    setSubmittingScore(true)

    try {
      const { data } = await api.post('/scores', { score: Number(scoreInput), date: dateInput })

      const res = await api.get('/scores')
      setScores(res.data.scores || [])
      
      setScoreInput('')
    } catch (err) {
      setScoreError(err.response?.data?.error || 'Failed to submit score')
    } finally {
      setSubmittingScore(false)
    }
  }

  const handleDeleteScore = async (id) => {
    if (!window.confirm('Are you sure you want to delete this score?')) return
    try {
      await api.delete(`/scores/${id}`)
      setScores(scores.filter(s => s.id !== id))
    } catch (err) {
      alert('Failed to delete score')
    }
  }
  
  const handlePortal = async () => {
    try {
      const { data } = await api.post('/subscriptions/portal')
      window.location.href = data.url
    } catch (err) {
      alert('Failed to open billing portal')
    }
  }

  if (loading) return <div className="spinner" style={{marginTop:'10rem'}} />

  if (!activeSub) {
    return (
      <div className="section dashboard-page">
        <div className="container text-center">
          <div className="card-glass" style={{maxWidth: 600, margin: '0 auto'}}>
            <h2>Subscription Required</h2>
            <p className="mt-md mb-lg">You need an active subscription to access the dashboard and enter the monthly draws.</p>
            <Link to="/subscribe" className="btn btn-primary btn-lg">Subscribe Now</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section dashboard-page">
      <div className="container">
        
        <div className="dashboard-header flex-between">
          <div>
            <div className="flex items-center">
              <h1>Welcome back, {user.name?.split(' ')[0]}</h1>
              {user.role === 'admin' && (
                <a 
                  href="https://digital-heroes-assignment-ha1l.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm ml-4"
                  style={{ fontSize: '0.75rem', height: 'auto', padding: '4px 10px' }}
                >
                  Admin Panel
                </a>
              )}
            </div>
            <p className="text-muted">Here is your current performance and draw status.</p>
          </div>
          {user.charity_id && (
            <div className="dashboard-charity-badge">
              <span>Supporting</span>
              <strong>{user.charity_percentage}%</strong>
            </div>
          )}
        </div>

        <div className="dashboard-grid mt-xl">
          {}
          <div className="dashboard-main">
            
            {}
            <div className="card dashboard-card">
              <div className="card-header flex-between mb-lg">
                <h3>My Recent Scores</h3>
                <span className="badge badge-primary">{scores.length} / 5 Logged</span>
              </div>
              
              <div className="scores-list mb-xl">
                {scores.length === 0 ? (
                  <p className="text-muted text-center py-4">No scores logged yet. Add your first score below.</p>
                ) : (
                  scores.map((score, index) => (
                    <div key={score.id} className="score-row">
                      <div className="score-row__info">
                        <span className="score-row__number">#{index + 1}</span>
                        <span className="score-row__date">{new Date(score.date).toLocaleDateString()}</span>
                      </div>
                      <div className="score-row__value">
                        <strong>{score.score}</strong> pts
                        <button onClick={() => handleDeleteScore(score.id)} className="btn-icon text-danger p-0 ml-2" title="Delete">×</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {}
              <div className="add-score-form p-4" style={{background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)'}}>
                <h4 className="mb-md">Enter New Score</h4>
                {scoreError && <div className="text-danger mb-sm text-sm">{scoreError}</div>}
                <form onSubmit={handleScoreSubmit} className="flex gap-md" style={{alignItems:'flex-end'}}>
                  <div className="flex-1">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-input" value={dateInput} onChange={e=>setDateInput(e.target.value)} required max={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="flex-1">
                    <label className="form-label">Stableford Points</label>
                    <input type="number" className="form-input" value={scoreInput} onChange={e=>setScoreInput(e.target.value)} required min="1" max="45" placeholder="e.g. 36" />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={submittingScore}>
                    {submittingScore ? 'Adding...' : 'Add Score'}
                  </button>
                </form>
                <p className="text-xs text-muted mt-sm">Only your latest 5 scores will be kept and used for the monthly draw.</p>
              </div>
            </div>

            {}
            {winnings.length > 0 && (
              <div className="card dashboard-card mt-lg">
                <div className="card-header mb-lg">
                  <h3>My Winnings</h3>
                </div>
                <div className="winnings-list">
                  {winnings.map(win => (
                    <div key={win.id} className="winning-row">
                      <div className="winning-row__info">
                        <strong>{win.draws?.month} Draw</strong>
                        <span className="badge badge-gold ml-2">{win.match_type}</span>
                      </div>
                      <div className="winning-row__amount text-gold font-heading text-lg font-bold">
                        £{win.prize_amount.toFixed(2)}
                      </div>
                      <div className="winning-row__status">
                        <span className={`badge badge-${win.status === 'paid' ? 'success' : 'warning'}`}>
                          {win.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {}
          <div className="dashboard-sidebar">
            
            {}
            <div className="card dashboard-card draw-status-card">
              <div className="draw-status-card__icon">🎯</div>
              <h3>Next Draw</h3>
              <p className="text-muted text-sm mt-1">Draws occur on the 1st of every month.</p>
              
              <div className="my-ticket mt-lg">
                <div className="text-xs text-uppercase text-muted mb-sm">Your Current Ticket Numbers</div>
                <div className="ticket-numbers flex gap-sm">
                  {scores.length === 0 ? (
                    <span className="text-muted text-sm">Log scores to generate your ticket.</span>
                  ) : (
                    Array(5).fill(0).map((_, i) => (
                      <div key={i} className={`ticket-number ${scores[i] ? 'filled' : 'empty'}`}>
                        {scores[i] ? scores[i].score : '?'}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="card dashboard-card mt-lg">
              <h3 className="mb-md">Subscription</h3>
              <div className="flex-between mb-md">
                <span className="text-muted">Plan</span>
                <strong className="text-capitalize">{activeSub.plan}</strong>
              </div>
              <div className="flex-between mb-md">
                <span className="text-muted">Status</span>
                <span className={`badge badge-${activeSub.status === 'active' ? 'success' : 'warning'}`}>
                  {activeSub.status}
                </span>
              </div>
              <div className="flex-between mb-lg">
                <span className="text-muted">Renews</span>
                <strong>{new Date(activeSub.renewal_date).toLocaleDateString()}</strong>
              </div>
              <button onClick={handlePortal} className="btn btn-outline btn-sm w-full">Manage Billing</button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
