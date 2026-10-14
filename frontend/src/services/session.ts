import { mockTokens, mockBackgrounds, mockSessions } from '../mockData'
import { useSessionStore } from '../store/sessionStore'

export function createSession() {
  const session = mockSessions[0]
  const store = useSessionStore.getState()
  store.setSession(
    session.id,
    session.code,
    mockTokens.map((t) => ({ id: t.id, token: t.token, used: t.used }))
  )
  store.setBackgrounds(mockBackgrounds)
}

export function joinByToken(token: string): boolean {
  const found = mockTokens.find((t) => t.token === token && !t.used)
  if (!found) return false
  useSessionStore.getState().setJoined(true)
  return true
}

export function setBackground(name: string) {
  useSessionStore.getState().setBackground(name)
}
