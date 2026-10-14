import { useState } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import { Copy, Check } from 'lucide-react'

export default function TokenGenerator() {
  const tokens = useSessionStore((s) => s.tokens)
  const [copied, setCopied] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const copyToken = async (token: string, id: number) => {
    await navigator.clipboard.writeText(token)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const copyAll = async () => {
    await navigator.clipboard.writeText(tokens.map((t) => t.token).join('\n'))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }

  const unusedCount = tokens.filter((t) => !t.used).length

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Session Tokens</h3>
        <button
          onClick={copyAll}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
        >
          {copiedAll ? <Check size={12} /> : <Copy size={12} />}
          {copiedAll ? 'Copied!' : 'Copy All'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tokens.map((t) => (
          <div
            key={t.id}
            className={`flex items-center justify-between p-2 rounded-lg border text-sm
              ${t.used ? 'opacity-50 bg-muted' : 'bg-background'}`}
          >
            <span className="font-mono tracking-wider">{t.token}</span>
            <button
              onClick={() => copyToken(t.token, t.id)}
              className="text-muted-foreground hover:text-foreground transition p-1"
              disabled={t.used}
            >
              {t.used ? (
                <span className="text-xs text-muted-foreground">used</span>
              ) : copied === t.id ? (
                <Check size={14} />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {unusedCount} of 6 tokens available
      </p>
    </div>
  )
}
