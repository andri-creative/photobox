import { create } from 'zustand'

interface UserPosition {
  userId: number
  username: string
  x: number
  y: number
  scale: number
}

interface SessionState {
  sessionId: string | null
  sessionCode: string | null
  tokens: Array<{ id: number; token: string; used: boolean }>
  joined: boolean
  background: string
  backgrounds: Array<{ id: number; name: string; url: string }>
  removeBgEnabled: boolean
  usersInFrame: UserPosition[]
  setSession: (sessionId: string, code: string, tokens: Array<{ id: number; token: string; used: boolean }>) => void
  setJoined: (joined: boolean) => void
  setBackground: (bg: string) => void
  setBackgrounds: (backgrounds: Array<{ id: number; name: string; url: string }>) => void
  setRemoveBgEnabled: (enabled: boolean) => void
  addUserToFrame: (user: UserPosition) => void
  removeUserFromFrame: (userId: number) => void
  updatePosition: (userId: number, pos: Partial<Pick<UserPosition, 'x' | 'y' | 'scale'>>) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  sessionCode: null,
  tokens: [],
  joined: false,
  background: 'beach',
  backgrounds: [],
  removeBgEnabled: true,
  usersInFrame: [],

  setSession: (sessionId, code, tokens) => set({
    sessionId,
    sessionCode: code,
    tokens,
  }),

  setJoined: (joined) => set({ joined }),

  setBackground: (background) => set({ background }),

  setBackgrounds: (backgrounds) => set({ backgrounds }),

  setRemoveBgEnabled: (removeBgEnabled) => set({ removeBgEnabled }),

  addUserToFrame: (user) => set((state) => ({
    usersInFrame: [...state.usersInFrame.filter(u => u.userId !== user.userId), user],
  })),

  removeUserFromFrame: (userId) => set((state) => ({
    usersInFrame: state.usersInFrame.filter(u => u.userId !== userId),
  })),

  updatePosition: (userId, pos) => set((state) => ({
    usersInFrame: state.usersInFrame.map(u =>
      u.userId === userId ? { ...u, ...pos } : u
    ),
  })),

  reset: () => set({
    sessionId: null,
    sessionCode: null,
    tokens: [],
    joined: false,
    background: 'beach',
    backgrounds: [],
    removeBgEnabled: true,
    usersInFrame: [],
  }),
}))
