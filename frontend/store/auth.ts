import { create } from 'zustand'
import { authApi, type User } from '@/api/auth'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  initialized: boolean

  initialize: () => void
  register: (email: string, password: string, name?: string, role?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  initialized: false,

  initialize: () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      set({ token, user: JSON.parse(user), initialized: true })
    } else {
      set({ initialized: true })
    }
  },

  register: async (email, password, name, role) => {
    set({ loading: true, error: null })
    try {
      const res = await authApi.register({ email, password, name, role })
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      set({ user: res.user, token: res.token, loading: false })
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Registration failed'
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const res = await authApi.login({ email, password })
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      set({ user: res.user, token: res.token, loading: false })
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Login failed'
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  clearError: () => set({ error: null }),
}))
