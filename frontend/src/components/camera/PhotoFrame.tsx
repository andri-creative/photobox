import { useState, useRef } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import { Camera, Download, X } from 'lucide-react'

export default function PhotoFrame({ onPhotoCaptured }: { onPhotoCaptured?: (path: string) => void }) {
  const usersInFrame = useSessionStore((s) => s.usersInFrame)
  const removeBgEnabled = useSessionStore((s) => s.removeBgEnabled)
  const background = useSessionStore((s) => s.background)
  const backgrounds = useSessionStore((s) => s.backgrounds)
  const [captured, setCaptured] = useState<string | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  const bgUrl = backgrounds.find((b) => b.name.toLowerCase() === background)?.url ?? backgrounds[0]?.url

  const handleCapture = () => {
    if (!frameRef.current) return
    const canvas = document.createElement('canvas')
    const rect = frameRef.current.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    const ctx = canvas.getContext('2d')!

    if (bgUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        drawUsers(ctx, canvas.width, canvas.height)
        setCaptured(canvas.toDataURL())
        onPhotoCaptured?.(canvas.toDataURL())
      }
      img.src = bgUrl
    } else {
      drawUsers(ctx, canvas.width, canvas.height)
      setCaptured(canvas.toDataURL())
    }
  }

  const drawUsers = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    usersInFrame.forEach((u) => {
      const cx = (u.x / 100) * w
      const cy = (u.y / 100) * h
      const size = 60 * u.scale

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(u.scale, u.scale)

      if (removeBgEnabled) {
        ctx.globalAlpha = 0.9
      }

      ctx.beginPath()
      ctx.arc(0, -size * 0.3, size * 0.25, 0, Math.PI * 2)
      ctx.fillStyle = `hsl(${(u.userId * 60) % 360}, 60%, 50%)`
      ctx.fill()

      ctx.beginPath()
      ctx.roundRect(-size * 0.4, -size * 0.05, size * 0.8, size * 0.6, size * 0.15)
      ctx.fill()

      ctx.restore()

      ctx.font = '10px sans-serif'
      ctx.fillStyle = 'white'
      ctx.textAlign = 'center'
      ctx.fillText(u.username, cx, cy + 40)
    })
  }

  return (
    <div className="space-y-3">
      <div
        ref={frameRef}
        className="relative aspect-video rounded-xl overflow-hidden bg-muted border"
        style={bgUrl ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {usersInFrame.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No users in frame yet</p>
          </div>
        ) : (
          <div className="absolute inset-0" id="frame-users"></div>
        )}

        {captured && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center space-y-3 p-4">
              <img src={captured} alt="Captured photo" className="max-h-48 mx-auto rounded-lg shadow" />
              <div className="flex items-center justify-center gap-2">
                <a
                  href={captured}
                  download="photobox.jpg"
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition"
                >
                  <Download size={14} />
                  Download
                </a>
                <button
                  onClick={() => setCaptured(null)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/70 transition"
                >
                  <X size={14} />
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {removeBgEnabled && (
          <div className="absolute top-2 left-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded">
            Remove BG: ON
          </div>
        )}
      </div>

      <button
        onClick={handleCapture}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium
          hover:opacity-90 transition flex items-center justify-center gap-2"
      >
        <Camera size={16} />
        Take Photo
      </button>
    </div>
  )
}
