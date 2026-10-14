import { useAuthStore } from '../../store/authStore'
import { useSessionStore } from '../../store/sessionStore'
import TokenInput from '../token/TokenInput'
import BackgroundSelector from '../camera/BackgroundSelector'
import { Settings, Sparkles } from 'lucide-react'

export default function SettingsPanel() {
  const user = useAuthStore((s) => s.user)
  const removeBgEnabled = useSessionStore((s) => s.removeBgEnabled)
  const setRemoveBg = useSessionStore((s) => s.setRemoveBgEnabled)
  const isHost = user?.role === 'host'

  return (
    <div className="bg-card rounded-xl border p-4 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Settings size={14} />
        Settings
      </h3>

      {!isHost && (
        <TokenInput />
      )}

      {isHost && (
        <BackgroundSelector />
      )}

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Sparkles size={14} className="text-muted-foreground" />
          Auto Remove Background
        </label>
        <button
          onClick={() => setRemoveBg(!removeBgEnabled)}
          className={`relative w-10 h-5 rounded-full transition
            ${removeBgEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all
              ${removeBgEnabled ? 'left-5' : 'left-0.5'}`}
          />
        </button>
      </div>
    </div>
  )
}
