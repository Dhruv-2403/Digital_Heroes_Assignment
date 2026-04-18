import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import './AuthPages.css'

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate    = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [charities, setCharities] = useState([])
  const [selectedCharity, setSelectedCharity]   = useState('')
  const [charityPct, setCharityPct]             = useState(10)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep]     = useState(1) // 1 = account info, 2 = charity selection

  useEffect(() => {
    api.get('/charities').then(({ data }) => setCharities(data.charities || [])).catch(() => {})
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleStep1 = (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match')
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters')
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signup(form.name, form.email, form.password)
      // Set charity if selected
      if (selectedCharity) {
        await api.post('/charities/select', {
          charity_id: selectedCharity,
          charity_percentage: charityPct,
        })
      }
      navigate('/subscribe')
    } catch (err) {
      setError(err.response?.data?.error || 'Sign up failed. Please try again.')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="glow-orb auth-orb1" />
      <div className="glow-orb auth-orb2" />

      <div className="auth-card auth-card--wide">
        <div className="auth-card__header">
          <Link to="/" className="auth-logo">⛳ Digital<span>Heroes</span></Link>
          <h1>{step === 1 ? 'Create your account' : 'Choose your charity'}</h1>
          <p>{step === 1 ? 'Play. Win. Give back.' : 'At least 10% of your subscription will be donated'}</p>
        </div>

        {/* Step indicator */}
        <div className="auth-steps">
          <div className={`auth-step ${step >= 1 ? 'active' : ''}`}>1 Account</div>
          <div className="auth-step-line" />
          <div className={`auth-step ${step >= 2 ? 'active' : ''}`}>2 Charity</div>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        {/* Step 1 — Account Info */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <input id="signup-name" name="name" type="text" className="form-input"
                placeholder="John Smith" value={form.name} onChange={handleChange} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email Address</label>
              <input id="signup-email" name="email" type="email" className="form-input"
                placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <input id="signup-password" name="password" type="password" className="form-input"
                placeholder="Minimum 8 characters" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
              <input id="signup-confirm" name="confirmPassword" type="password" className="form-input"
                placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{width:'100%'}}>
              Continue to Charity →
            </button>
          </form>
        )}

        {/* Step 2 — Charity Selection */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="signup-charity">Select a Charity</label>
              <select id="signup-charity" className="form-select"
                value={selectedCharity} onChange={e => setSelectedCharity(e.target.value)}>
                <option value="">-- Choose a charity (optional) --</option>
                {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {selectedCharity && (
              <div className="form-group">
                <label className="form-label">Your Donation % (min 10%)</label>
                <div className="charity-pct-slider">
                  <input type="range" min="10" max="100" step="5"
                    value={charityPct} onChange={e => setCharityPct(Number(e.target.value))} />
                  <span className="charity-pct-value">{charityPct}%</span>
                </div>
                <p className="form-hint">
                  At least {charityPct}% of every subscription goes to your chosen charity.
                </p>
              </div>
            )}

            <div className="auth-step-buttons">
              <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-card__footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
