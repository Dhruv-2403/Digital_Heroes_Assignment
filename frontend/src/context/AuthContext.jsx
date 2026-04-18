import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('dh_token')
    const saved = localStorage.getItem('dh_user')
    if (token && saved) {
      setUser(JSON.parse(saved))
      // Re-validate token with server
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data.user)
          localStorage.setItem('dh_user', JSON.stringify(data.user))
        })
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('dh_token', data.token)
    localStorage.setItem('dh_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password })
    localStorage.setItem('dh_token', data.token)
    localStorage.setItem('dh_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('dh_token')
    localStorage.removeItem('dh_user')
    setUser(null)
  }

  const updateUser = (updated) => {
    setUser(updated)
    localStorage.setItem('dh_user', JSON.stringify(updated))
  }

  const isAdmin       = user?.role === 'admin'
  const isSubscribed  = user?.subscriptions?.[0]?.status === 'active'

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, isAdmin, isSubscribed }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
