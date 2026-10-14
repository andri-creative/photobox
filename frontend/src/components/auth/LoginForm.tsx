import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { login } from '../../services/auth'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/home')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="text-5xl font-bold mb-2">Photobox</div>
        <p className="text-muted-foreground text-sm">
          Shared camera booth with real-time compositing
        </p>
      </div>

      <div className="bg-card rounded-xl border p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-3 py-2 border rounded-lg bg-background text-foreground
                focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground
                  focus:outline-none focus:ring-2 focus:ring-primary/50 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium
              hover:opacity-90 transition flex items-center justify-center gap-2
              disabled:opacity-50"
          >
            <LogIn size={16} />
            {loading ? 'Signing in...' : 'Masuk'}
          </button>
        </form>

        <div className="text-xs text-muted-foreground border-t pt-3">
          <p>Demo accounts:</p>
          <p>Host: <code className="bg-muted px-1 rounded">host</code> / <code className="bg-muted px-1 rounded">host123</code></p>
          <p>Guest: <code className="bg-muted px-1 rounded">guest1</code> / <code className="bg-muted px-1 rounded">guest123</code></p>
        </div>
      </div>
    </div>
  )
}
