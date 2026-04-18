import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('dh_admin_token')
    const saved = localStorage.getItem('dh_admin_user')
    if (token && saved) {
      setUser(JSON.parse(saved))
      // Re-validate token with server
      api.get('/auth/me')
        .then(({ data }) => {
          // ensure it's still an admin role
          if (data.user.role !== 'admin') {
            logout()
          } else {
            setUser(data.user)
            localStorage.setItem('dh_admin_user', JSON.stringify(data.user))
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    if (data.user.role !== 'admin') {
      throw new Error("Access Denied: You must be an administrator")
    }
    localStorage.setItem('dh_admin_token', data.token)
    localStorage.setItem('dh_admin_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('dh_admin_token')
    localStorage.removeItem('dh_admin_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
