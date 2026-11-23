import { useNavigate } from 'react-router'
import { Clock, Coins } from 'lucide-react'

const MODES = [
  { id: 'money', label: 'Расходы', icon: Coins, path: '/' },
  { id: 'time', label: 'Время', icon: Clock, path: '/time' },
] as const

export default function ModeSwitch({ mode }: { mode: 'money' | 'time' }) {
  const navigate = useNavigate()
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1">
      {MODES.map((m) => {
        const Icon = m.icon
        const active = mode === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => navigate(m.path)}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] ${
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
