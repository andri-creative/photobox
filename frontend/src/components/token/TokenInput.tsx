import { useState } from 'react'
import { joinByToken } from '../../services/session'
import { useAuthStore } from '../../store/authStore'
import { useSessionStore } from '../../store/sessionStore'
import { KeyRound, CheckCircle } from 'lucide-react'

export default function TokenInput() {
  const user = useAuthStore((s) => s.user)
  const joined = useSessionStore((s) => s.joined)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
    if (!token.trim()) {
      setError('Please enter a token')
      return
    }
    const valid = joinByToken(token.trim().toUpperCase())
    if (valid) {
      setError('')
      useSessionStore.getState().addUserToFrame({
        userId: user!.id,
        username: user!.username,
        x: 50,
        y: 50,
        scale: 1,
      })
    } else {
      setError('Invalid or used token')
    }
  }

  if (joined) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
        <CheckCircle size={16} className="text-green-500" />
        <span className="text-sm text-green-700">Joined session. Viewing live frame.</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <KeyRound size={14} />
        Session Token
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value.toUpperCase())}
          placeholder="Enter 6-char token"
          maxLength={6}
          className="flex-1 px-3 py-2 border rounded-lg bg-background text-foreground
            font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50
            uppercase"
        />
        <button
          onClick={handleJoin}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium
            hover:opacity-90 transition text-sm whitespace-nowrap"
        >
          Join
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
