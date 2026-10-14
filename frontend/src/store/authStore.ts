import { create } from 'zustand'

interface AuthUser {
  id: number
  username: string
  role: 'host' | 'guest'
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  login: (username: string, password: string) => Promise<AuthUser>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  login: async (username, password) => {
    const { mockUsers } = await import('../mockData')
    const found = mockUsers.find(
      (u) => u.username === username && u.password === password
    )
    if (!found) {
      throw new Error('INVALID_CREDENTIALS')
    }
    const dummyJwt = btoa(JSON.stringify({
      userId: found.id,
      role: found.role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }))
    const user: AuthUser = {
      id: found.id,
      username: found.username,
      role: found.role,
    }
    set({ user, token: dummyJwt })
    return user
  },

  logout: () => set({ user: null, token: null }),
}))
