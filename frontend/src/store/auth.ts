import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { api } from '../lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  permissions: string[]
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  refreshPermissions: () => Promise<void>
  logout: () => void
}

interface RegisterData {
  email: string
  phone: string
  password: string
  full_name: string
  county?: string
  role?: string
}

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        storeTokens(data.access_token, data.refresh_token)
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          permissions: data.permissions ?? [],
          isAuthenticated: true,
        })
      },

      register: async (registerData) => {
        const { data } = await api.post('/auth/register', registerData)
        storeTokens(data.access_token, data.refresh_token)
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          permissions: data.permissions ?? [],
          isAuthenticated: true,
        })
      },

      refreshPermissions: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({
            user: data.user,
            permissions: data.permissions ?? [],
          })
        } catch {
          // Silently ignore — stale permissions are fine until next login
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          permissions: [],
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'medassist-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
