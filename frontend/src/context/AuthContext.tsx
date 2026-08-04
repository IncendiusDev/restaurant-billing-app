import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { api, clearAuth, getStoredUser, setAuth } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  restaurantName: string
  slug: string
  adminName: string
  adminEmail: string
  adminPassword: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser<User>())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(email, password) {
        const res = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password })
        setAuth(res.token, res.user)
        setUser(res.user)
        return res.user
      },
      async register(data) {
        const res = await api.post<{ token: string; restaurant: unknown }>('/api/auth/register-restaurant', data)
        const loginRes = await api.post<{ token: string; user: User }>('/api/auth/login', {
          email: data.adminEmail,
          password: data.adminPassword,
        })
        setAuth(loginRes.token, loginRes.user)
        setUser(loginRes.user)
        void res
      },
      logout() {
        clearAuth()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
