import { mockUsers } from '../mockData'
import { useAuthStore } from '../store/authStore'

export async function login(username: string, password: string) {
  const found = mockUsers.find(
    (u) => u.username === username && u.password === password
  )
  if (!found) {
    throw new Error('Invalid username or password')
  }
  return useAuthStore.getState().login(username, password)
}

export function logout() {
  useAuthStore.getState().logout()
}

export function getToken() {
  return useAuthStore.getState().token
}

export function getUser() {
  return useAuthStore.getState().user
}
