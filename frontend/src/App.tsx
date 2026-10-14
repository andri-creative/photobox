import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'

function App() {
  const user = useAuthStore((s) => s.user)

  const isLoggedIn = user !== null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/home" /> : <LoginPage />} />
        <Route path="/home" element={isLoggedIn ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={isLoggedIn ? '/home' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
