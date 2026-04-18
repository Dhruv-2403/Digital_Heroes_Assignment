import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import './CharitiesPage.css'

export default function CharitiesPage() {
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let url = '/charities'
    if (search) url += `?search=${encodeURIComponent(search)}`

    api.get(url)
      .then(({ data }) => {
        setCharities(data.charities || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div className="section charities-page">
      <div className="container">
        
        <div className="charities-hero text-center mb-2xl">
          <span className="section-tag">Make an Impact</span>
          <h1 className="mb-md">Support the causes you care about</h1>
          <p className="text-muted" style={{maxWidth: 600, margin: '0 auto'}}>
            At least 10% of every subscription goes directly to a charity of your choice.
            Explore our partners below.
          </p>
        </div>

        <div className="charities-search-bar mb-xl">
          <input 
            type="text" 
            placeholder="Search charities..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input" 
          />
        </div>

        {loading ? (
          <div className="spinner" />
        ) : charities.length === 0 ? (
          <div className="text-center text-muted mt-xl">No charities found matching your search.</div>
        ) : (
          <div className="charities-grid">
            {charities.map(charity => (
              <Link to={`/charities/${charity.id}`} key={charity.id} className="charity-card">
                <div className="charity-card__image">
                  {charity.image_url ? (
                    <img src={charity.image_url} alt={charity.name} />
                  ) : (
                    <div className="charity-card__placeholder">🤝</div>
                  )}
                  {charity.featured && <div className="charity-card__badge">Featured</div>}
                </div>
                <div className="charity-card__content">
                  <h3>{charity.name}</h3>
                  <p>{charity.description?.substring(0, 100)}{charity.description?.length > 100 ? '...' : ''}</p>
                  <span className="charity-card__link">View details & donate →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
