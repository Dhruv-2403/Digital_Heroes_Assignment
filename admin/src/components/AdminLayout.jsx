import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          Digital<span>Heroes</span>&nbsp;Admin
        </div>
        <nav className="admin-nav">
          <NavLink to="/dashboard" className="admin-nav-link">📊 Dashboard</NavLink>
          <NavLink to="/users" className="admin-nav-link">👥 Users</NavLink>
          <NavLink to="/draws" className="admin-nav-link">🎲 Draws</NavLink>
          <NavLink to="/winners" className="admin-nav-link">🏆 Winners</NavLink>
          <NavLink to="/charities" className="admin-nav-link">❤️ Charities</NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="flex align-center gap-md">
            <span className="text-muted text-sm">{user?.email}</span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">Log out</button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
