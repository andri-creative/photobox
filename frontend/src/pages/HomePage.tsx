import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSessionStore } from '../store/sessionStore'
import { createSession } from '../services/session'
import AppLayout from '../components/layout/AppLayout'
import SettingsPanel from '../components/layout/SettingsPanel'
import TokenGenerator from '../components/token/TokenGenerator'
import CameraFeed from '../components/camera/CameraFeed'
import PhotoFrame from '../components/camera/PhotoFrame'

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const tokens = useSessionStore((s) => s.tokens)
  const joined = useSessionStore((s) => s.joined)
  const isHost = user?.role === 'host'

  useEffect(() => {
    if (isHost && tokens.length === 0) {
      createSession()
    }
  }, [isHost, tokens.length])

  if (!user) return null

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <CameraFeed isHost={isHost} />

          <PhotoFrame />

          {isHost && <TokenGenerator />}

          {!isHost && !joined && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Enter your session token in the Settings panel to join the photobooth.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SettingsPanel />
        </div>
      </div>
    </AppLayout>
  )
}
