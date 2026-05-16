import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, tokenStore } from '@/api/client'

const AuthContext = createContext(null)

const ROLES = {
  ADMIN: { label: 'Administrator', allowedPaths: ['*'] },
  IE: { label: 'Industrial Engineer', allowedPaths: ['/dashboard', '/ob', '/skills', '/allocation', '/machines', '/checklists'] },
  SUPERVISOR: { label: 'Line Supervisor', allowedPaths: ['/dashboard', '/allocation', '/checklists'] },
  MAINTENANCE: { label: 'Maintenance', allowedPaths: ['/dashboard', '/machines'] },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = tokenStore.get()
    if (!token) { setLoading(false); return }
    api.me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await api.login(email, password)
    tokenStore.set(token)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  const canAccess = useCallback(path => {
    if (!user) return false
    const r = ROLES[user.role]
    if (!r) return false
    if (r.allowedPaths.includes('*')) return true
    return r.allowedPaths.some(p => path === p || path.startsWith(p + '/'))
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, canAccess, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { ROLES }
