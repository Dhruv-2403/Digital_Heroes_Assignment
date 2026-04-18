import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './components/AdminLayout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/UsersPage'
import DrawsPage from './pages/DrawsPage'
import CharitiesPage from './pages/CharitiesPage'
import WinnersPage from './pages/WinnersPage'

function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="admin-login"><div className="spinner" /></div>
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />
  return children
}

function AppShell() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="draws" element={<DrawsPage />} />
        <Route path="charities" element={<CharitiesPage />} />
        <Route path="winners" element={<WinnersPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
