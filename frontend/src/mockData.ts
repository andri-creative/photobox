export interface User {
  id: number
  username: string
  password: string
  role: 'host' | 'guest'
}

export interface Session {
  id: string
  hostId: number
  code: string
  active: boolean
  bg: string
}

export interface JoinToken {
  id: number
  sessionId: string
  token: string
  used: boolean
  createdAt: string
}

export interface Background {
  id: number
  name: string
  url: string
}

export const mockUsers: User[] = [
  { id: 1, username: 'host', password: 'host123', role: 'host' },
  { id: 2, username: 'guest1', password: 'guest123', role: 'guest' },
  { id: 3, username: 'guest2', password: 'guest123', role: 'guest' },
]

export const mockSessions: Session[] = [
  { id: 's1', hostId: 1, code: 'PHOBOX', active: true, bg: 'beach' },
]

export const mockTokens: JoinToken[] = [
  { id: 1, sessionId: 's1', token: 'A1B2C3', used: false, createdAt: '2026-10-13T10:00:00Z' },
  { id: 2, sessionId: 's1', token: 'D4E5F6', used: false, createdAt: '2026-10-13T10:00:00Z' },
  { id: 3, sessionId: 's1', token: 'G7H8I9', used: false, createdAt: '2026-10-13T10:00:00Z' },
  { id: 4, sessionId: 's1', token: 'J1K2L3', used: false, createdAt: '2026-10-13T10:00:00Z' },
  { id: 5, sessionId: 's1', token: 'M4N5O6', used: false, createdAt: '2026-10-13T10:00:00Z' },
  { id: 6, sessionId: 's1', token: 'P7Q8R9', used: false, createdAt: '2026-10-13T10:00:00Z' },
]

export const mockBackgrounds: Background[] = [
  { id: 1, name: 'Beach', url: 'https://images.unsplash.com/photo-1507525428034-bfa279c9f99c?w=1200' },
  { id: 2, name: 'Forest', url: 'https://images.unsplash.com/photo-1448310387332-57a7d66ef37c?w=1200' },
  { id: 3, name: 'City', url: 'https://images.unsplash.com/photo-1477959858616-4f971c2a77c8?w=1200' },
  { id: 4, name: 'Space', url: 'https://images.unsplash.com/photo-1462331940025-49b608ed918b?w=1200' },
  { id: 5, name: 'Neon', url: 'https://images.unsplash.com/photo-1558618666-83224e5f5f91?w=1200' },
  { id: 6, name: 'Sunny', url: 'https://images.unsplash.com/photo-1500382017864-506f92f9a5ba?w=1200' },
]
