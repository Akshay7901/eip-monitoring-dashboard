import { createContext, useContext, useMemo, useState } from 'react'
import { login as loginRequest } from '../api'

const STORAGE_KEY = 'eip_auth'
const AuthContext = createContext(null)

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.token || !parsed?.expiresAt) return null
    if (Date.now() >= parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth)

  const login = async (username, password) => {
    const data = await loginRequest(username, password)
    const expiresAt = Date.now() + data.expires_in_hours * 60 * 60 * 1000
    const next = { token: data.token, expiresAt }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setAuth(next)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuth(null)
  }

  const value = useMemo(
    () => ({
      token: auth?.token ?? null,
      isAuthenticated: !!auth?.token,
      login,
      logout,
    }),
    [auth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
