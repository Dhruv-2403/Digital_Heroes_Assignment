import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import './SubscribePage.css'

export default function SubscribePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState('monthly') // 'monthly' | 'yearly'

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/subscriptions/checkout', { plan })
      window.location.href = data.url // redirect to Stripe checkout
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize checkout')
      setLoading(false)
    }
  }

  return (
    <div className="section subscribe-page">
      <div className="container">
        <div className="section-header text-center">
          <span className="section-tag">Final Step</span>
          <h2>Activate your subscription</h2>
          <p>Join the community, enter the draw, and support your charity.</p>
        </div>

        {error && <div className="subscribe-alert">{error}</div>}

        <div className="billing-toggle">
          <span className={plan === 'monthly' ? 'active' : ''}>Monthly</span>
          <button 
            type="button" 
            className="toggle-switch" 
            onClick={() => setPlan(plan === 'monthly' ? 'yearly' : 'monthly')}
          >
            <div className={`slider slider--${plan}`} />
          </button>
          <span className={plan === 'yearly' ? 'active' : ''}>
            Yearly <span className="discount-badge">Save 16%</span>
          </span>
        </div>

        <div className="pricing-cards">
          {}
          <div className={`pricing-card ${plan === 'monthly' ? 'selected' : ''}`} onClick={() => setPlan('monthly')}>
            {plan === 'monthly' && <div className="pricing-card__badge">Selected</div>}
            <h3>Monthly Plan</h3>
            <div className="price">
              £10<span>/month</span>
            </div>
            <ul className="features">
              <li>✓ Enter 1 monthly prize draw</li>
              <li>✓ Minimum 10% to charity</li>
              <li>✓ Track unlimited scores</li>
              <li>✓ Cancel anytime</li>
            </ul>
          </div>

          {}
          <div className={`pricing-card pricing-card--featured ${plan === 'yearly' ? 'selected' : ''}`} onClick={() => setPlan('yearly')}>
            <div className="pricing-card__glow" />
            {plan === 'yearly' && <div className="pricing-card__badge">Selected</div>}
            <h3>Yearly Plan</h3>
            <div className="price">
              £100<span>/year</span>
            </div>
            <ul className="features">
              <li>✓ Enter 12 monthly prize draws</li>
              <li>✓ Minimum 10% to charity</li>
              <li>✓ Track unlimited scores</li>
              <li>✓ Two months free</li>
            </ul>
          </div>
        </div>

        <div className="subscribe-cta text-center mt-xl">
          <button 
            onClick={handleSubscribe} 
            className="btn btn-primary btn-lg" 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed to Checkout →'}
          </button>
          <p className="secure-payment">🔒 Secure payment via Stripe</p>
        </div>
      </div>
    </div>
  )
}
