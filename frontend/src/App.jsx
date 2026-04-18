import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import HomePage        from './pages/HomePage'
import LoginPage       from './pages/LoginPage'
import SignupPage      from './pages/SignupPage'
import SubscribePage   from './pages/SubscribePage'
import DashboardPage   from './pages/DashboardPage'
import CharitiesPage   from './pages/CharitiesPage'
import CharityDetail   from './pages/CharityDetailPage'
import WinnersPage     from './pages/WinnersPage'

// Layout
import Navbar  from './components/Navbar'
import Footer  from './components/Footer'

// ─── Route Guards ─────────────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner" style={{marginTop:'10rem'}} />
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner" style={{marginTop:'10rem'}} />
  return !user ? children : <Navigate to="/dashboard" replace />
}

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          {/* Public */}
          <Route path="/"           element={<HomePage />} />
          <Route path="/charities"  element={<CharitiesPage />} />
          <Route path="/charities/:id" element={<CharityDetail />} />
          <Route path="/winners"    element={<WinnersPage />} />

          {/* Guest only */}
          <Route path="/login"  element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

          {/* Auth required */}
          <Route path="/subscribe" element={<PrivateRoute><SubscribePage /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
