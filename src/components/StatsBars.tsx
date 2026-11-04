import { useMemo } from 'react'
import type { Category, Purchase } from '@/types'
import { dayKey, formatMoney, parseDayKey } from '@/lib/format'

interface StatsBarsProps {
  purchases: Purchase[]
  selectedDay: string
  onSelectDay: (day: string) => void
}

const BAR_DAYS = 14

export function DayBars({ purchases, selectedDay, onSelectDay }: StatsBarsProps) {
  const days = useMemo(() => {
    const totals = new Map<string, number>()
    for (const p of purchases) {
      const k = dayKey(new Date(p.date))
      totals.set(k, (totals.get(k) ?? 0) + p.amount)
    }
    const today = dayKey(new Date())
    const end = selectedDay > today ? selectedDay : today
    const endDate = parseDayKey(end)
    const list: { key: string; total: number; label: string }[] = []
    for (let i = BAR_DAYS - 1; i >= 0; i--) {
      const d = new Date(endDate)
      d.setDate(d.getDate() - i)
      const k = dayKey(d)
      list.push({
        key: k,
        total: totals.get(k) ?? 0,
        label: String(d.getDate()),
      })
    }
    return list
  }, [purchases, selectedDay])

  const max = Math.max(1, ...days.map((d) => d.total))

  return (
    <div>
      <div className="flex h-24 items-end gap-1.5">
        {days.map((d) => {
          const active = d.key === selectedDay
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onSelectDay(d.key)}
              aria-label={`${d.label}, потрачено ${formatMoney(d.total)}`}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-md outline-none transition-colors focus-visible:bg-accent"
            >
              <div
                className={`w-full rounded-t-md transition-all duration-200 ${
                  active
                    ? 'bg-primary'
                    : d.total > 0
                      ? 'bg-primary/35 group-hover:bg-primary/60'
                      : 'bg-muted group-hover:bg-accent'
                }`}
                style={{ height: `${Math.max(d.total > 0 ? 8 : 3, (d.total / max) * 100)}%` }}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-1 flex gap-1.5">
        {days.map((d) => (
          <div
            key={d.key}
            className={`min-w-0 flex-1 text-center text-[10px] ${
              d.key === selectedDay ? 'font-semibold text-deep' : 'text-muted-foreground'
            }`}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

interface CategoryBarsProps {
  purchases: Purchase[]
  categories: Category[]
}

export function CategoryBars({ purchases, categories }: CategoryBarsProps) {
  const rows = useMemo(() => {
    const totals = new Map<string, number>()
    let uncategorized = 0
    for (const p of purchases) {
      if (p.categoryId && categories.some((c) => c.id === p.categoryId)) {
        totals.set(p.categoryId, (totals.get(p.categoryId) ?? 0) + p.amount)
      } else {
        uncategorized += p.amount
      }
    }
    const list = categories
      .filter((c) => (totals.get(c.id) ?? 0) > 0)
      .map((c) => ({ name: c.name, color: c.color, total: totals.get(c.id) ?? 0 }))
    if (uncategorized > 0) {
      list.push({ name: 'Без категории', color: '#78716c', total: uncategorized })
    }
    return list.sort((a, b) => b.total - a.total)
  }, [purchases, categories])

  if (rows.length === 0) return null
  const max = rows[0].total

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.name} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate">{r.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatMoney(r.total)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(r.total / max) * 100}%`, backgroundColor: r.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
