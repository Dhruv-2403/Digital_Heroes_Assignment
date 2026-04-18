import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        {}
        <Link to="/" className="navbar__logo">
          <img src="/image.png" alt="Digital Heroes Logo" className="navbar__logo-image" />
          <span className="navbar__logo-text">Digital<span>Heroes</span></span>
        </Link>

        {}
        <nav className="navbar__links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
          <NavLink to="/charities" className={({ isActive }) => isActive ? 'active' : ''}>Charities</NavLink>
          <NavLink to="/winners" className={({ isActive }) => isActive ? 'active' : ''}>Winners</NavLink>
        </nav>

        {}
        <div className="navbar__actions">
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-outline btn-sm">Dashboard</Link>
              <button onClick={handleLogout} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Log In</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>

        {}
        <button
          className={`navbar__burger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {}
      <div className={`navbar__mobile ${menuOpen ? 'navbar__mobile--open' : ''}`}>
        <NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
        <NavLink to="/charities" onClick={() => setMenuOpen(false)}>Charities</NavLink>
        <NavLink to="/winners" onClick={() => setMenuOpen(false)}>Winners</NavLink>
        {user ? (
          <>
            <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
            <button onClick={handleLogout} className="btn btn-danger btn-sm mt-md">Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-sm mt-md">Log In</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn btn-primary btn-sm mt-sm">Get Started</Link>
          </>
        )}
      </div>
    </header>
  )
}
