import { useSessionStore } from '../../store/sessionStore'
import { Check } from 'lucide-react'

export default function BackgroundSelector() {
  const backgrounds = useSessionStore((s) => s.backgrounds)
  const selected = useSessionStore((s) => s.background)
  const setSelected = useSessionStore((s) => s.setBackground)

  return (
    <div className="bg-card rounded-xl border p-4">
      <h3 className="font-semibold text-sm mb-3">Background</h3>
      <div className="grid grid-cols-3 gap-2">
        {backgrounds.map((bg) => (
          <button
            key={bg.id}
            onClick={() => setSelected(bg.name.toLowerCase())}
            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition
              ${selected === bg.name.toLowerCase()
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-transparent hover:border-muted-foreground/30'
              }`}
          >
            <img
              src={bg.url}
              alt={bg.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5">
              {bg.name}
            </span>
            {selected === bg.name.toLowerCase() && (
              <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                <Check size={12} className="text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
