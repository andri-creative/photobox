import { useAuthStore } from '../../store/authStore'
import { logout } from '../../services/auth'
import { LogOut } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  if (!user) return <>{children}</>

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Photobox</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {user.role === 'host' ? 'HOST' : 'GUEST'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.username}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
