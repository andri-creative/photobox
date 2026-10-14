import { useRef, useEffect, useState } from 'react'
import { Video, VideoOff, RefreshCw, User, Camera } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function CameraFeed({ isHost = false }: { isHost?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [dummyMode, setDummyMode] = useState(false)
  const user = useAuthStore((s) => s.user)

  const startCamera = async () => {
    setRetrying(true)
    setError('')
    setDummyMode(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setActive(true)
      }
    } catch {
      setError('Camera access denied or unavailable')
    } finally {
      setRetrying(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    startCamera()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      setActive(false)
    }
  }, [])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setActive(false)
  }

  const toggleDummy = () => {
    stopCamera()
    setDummyMode(!dummyMode)
    setError('')
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
      {active ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : dummyMode ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/20">
          <div className="text-center space-y-3 p-4">
            <div className="relative w-24 h-24 mx-auto">
              <div
                className="absolute inset-0 rounded-full border-2 border-primary/30 flex items-center justify-center"
                style={{ transform: 'scale(1)' }}
              >
                <User size={32} className="text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-card rounded-full border flex items-center justify-center">
                <Camera size={12} className="text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="font-medium text-sm">{user?.username || 'User'}</p>
              <p className="text-xs text-muted-foreground">Dummy camera mode</p>
            </div>
            <button
              onClick={toggleDummy}
              className="text-xs text-primary hover:underline"
            >
              Enable real camera
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            {error ? (
              <>
                <VideoOff size={32} className="mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={startCamera}
                    disabled={retrying}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} />
                    Retry
                  </button>
                  <button
                    onClick={toggleDummy}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-muted text-foreground rounded-lg hover:bg-muted/70 transition"
                  >
                    <User size={12} />
                    Dummy Mode
                  </button>
                </div>
              </>
            ) : (
              <>
                <Video size={32} className="mx-auto text-muted-foreground animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  {isHost ? 'Starting camera...' : 'Waiting for host feed...'}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {active && (
        <button
          onClick={stopCamera}
          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg
            hover:bg-black/70 transition"
        >
          <VideoOff size={14} />
        </button>
      )}

      {active && (
        <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
          LIVE
        </div>
      )}
    </div>
  )
}
