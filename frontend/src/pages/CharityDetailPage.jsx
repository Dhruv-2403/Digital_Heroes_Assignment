import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import './CharityDetailPage.css'

export default function CharityDetailPage() {
  const { id } = useParams()
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  
  const [charity, setCharity] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Selection state
  const [isUpdating, setIsUpdating] = useState(false)
  const [charityPct, setCharityPct] = useState(user?.charity_percentage || 10)

  useEffect(() => {
    api.get(`/charities/${id}`)
      .then(({ data }) => setCharity(data.charity))
      .catch(() => navigate('/charities'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleSelectCharity = async () => {
    if (!user) {
      navigate('/signup')
      return
    }

    setIsUpdating(true)
    try {
      const { data } = await api.post('/charities/select', {
        charity_id: id,
        charity_percentage: charityPct
      })
      updateUser(data.user)
      alert('Charity updated successfully!')
    } catch (err) {
      alert('Failed to update charity selection.')
    } finally {
      setIsUpdating(false)
    }
  }

  const isCurrentCharity = user?.charity_id === id

  if (loading) return <div className="spinner" style={{marginTop:'10rem'}} />
  if (!charity) return null

  return (
    <div className="charity-detail-page">
      {/* Hero */}
      <div className="charity-detail-hero">
        {charity.image_url && <div className="charity-detail-hero__bg" style={{backgroundImage: `url(${charity.image_url})`}} />}
        <div className="charity-detail-hero__overlay" />
        <div className="container">
          <Link to="/charities" className="back-link mb-lg inline-block">← Back to Charities</Link>
          <div className="charity-detail-hero__content">
            {charity.featured && <span className="badge badge-primary mb-md inline-block">Featured Partner</span>}
            <h1 className="mb-md">{charity.name}</h1>
          </div>
        </div>
      </div>

      <div className="container section">
        <div className="charity-detail-grid">
          {/* Main Content */}
          <div className="charity-detail-main">
            <h2>About this Cause</h2>
            <div className="charity-description mt-lg">
              {charity.description?.split('\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              {!charity.description && <p className="text-muted">No description available for this charity.</p>}
            </div>
            
            <div className="mt-xl pt-lg border-t" style={{borderColor: 'var(--color-border)'}}>
              <h3>Our Partnership</h3>
              <p className="mt-md text-muted">
                Digital Heroes is proud to partner with {charity.name}. When you select them as your designated charity, a guaranteed minimum of 10% of your subscription fee goes directly to supporting their work. You can choose to contribute up to 100% of your fee.
              </p>
            </div>
          </div>

          {/* Sidebar Action */}
          <div className="charity-detail-sidebar">
            <div className="card-glass selection-card">
              <h3 className="mb-md">Support {charity.name}</h3>
              <p className="text-sm text-muted mb-lg">
                Link this charity to your account to automatically donate a portion of your subscription every month.
              </p>

              {isCurrentCharity ? (
                <div className="current-selection-alert mb-lg">
                  <span className="text-success text-center block mb-sm">✓ Currently Supporting</span>
                  <p className="text-sm text-center">You are currently donating {user.charity_percentage}% to this charity.</p>
                </div>
              ) : null}

              {user ? (
                <div className="donation-config">
                  <label className="form-label mb-sm block">Donation Percentage</label>
                  <div className="charity-pct-slider mb-md">
                    <input 
                      type="range" 
                      min="10" max="100" step="5"
                      value={charityPct} 
                      onChange={e => setCharityPct(Number(e.target.value))} 
                    />
                    <span className="charity-pct-value">{charityPct}%</span>
                  </div>
                  <p className="text-xs text-muted mb-lg">Minimum 10% required by platform rules.</p>

                  <button 
                    onClick={handleSelectCharity}
                    className="btn btn-primary w-full"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : (isCurrentCharity ? 'Update Percentage' : 'Select as My Charity')}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Link to="/signup" className="btn btn-primary w-full mb-md">Create Account to Support</Link>
                  <p className="text-xs text-muted">A minimum 10% of all subscriptions go to charity.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
