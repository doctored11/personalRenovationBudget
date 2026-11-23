import { useMemo, useState } from 'react'
import type { Category } from '@/types'
import { dayKey, parseDayKey } from '@/lib/format'

export interface StatItem {
  date: string
  value: number
  categoryId: string | null
}

type ViewMode = 'days' | 'categories'
type Period = '7d' | '30d' | 'all'

const PERIODS: { id: Period; label: string }[] = [
  { id: '7d', label: '7 дней' },
  { id: '30d', label: '30 дней' },
  { id: 'all', label: 'Всё время' },
]
const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'days', label: 'По дням' },
  { id: 'categories', label: 'По категориям' },
]

interface Bucket {
  key?: string
  label: string
  total: number
}

function useBuckets(items: StatItem[], period: Period): Bucket[] {
  return useMemo(() => {
    const totals = new Map<string, number>()
    let minKey: string | null = null
    for (const it of items) {
      const k = dayKey(new Date(it.date))
      totals.set(k, (totals.get(k) ?? 0) + it.value)
      if (!minKey || k < minKey) minKey = k
    }
    const today = dayKey(new Date())
    const start =
      period === 'all' && minKey
        ? minKey
        : dayKey(new Date(Date.now() - (period === '7d' ? 6 : 29) * 86400000))

    const daily: { key: string; total: number }[] = []
    const cursor = parseDayKey(start)
    const end = parseDayKey(today)
    while (cursor <= end) {
      const k = dayKey(cursor)
      daily.push({ key: k, total: totals.get(k) ?? 0 })
      cursor.setDate(cursor.getDate() + 1)
    }

    if (daily.length > 62) {
      const weeks: Bucket[] = []
      for (let i = 0; i < daily.length; i += 7) {
        const chunk = daily.slice(i, i + 7)
        weeks.push({
          label: String(parseDayKey(chunk[0].key).getDate()),
          total: chunk.reduce((s, d) => s + d.total, 0),
        })
      }
      return weeks
    }
    return daily.map((d) => ({ key: d.key, label: String(parseDayKey(d.key).getDate()), total: d.total }))
  }, [items, period])
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function DaysChart({
  buckets,
  selectedDay,
  onSelectDay,
  formatValue,
}: {
  buckets: Bucket[]
  selectedDay?: string
  onSelectDay?: (key: string) => void
  formatValue: (n: number) => string
}) {
  const W = 340
  const H = 140
  const PAD = { top: 14, bottom: 22, left: 6, right: 6 }
  const max = Math.max(1, ...buckets.map((b) => b.total))
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const points = buckets.map((b, i) => ({
    x: PAD.left + (buckets.length === 1 ? innerW / 2 : (i / (buckets.length - 1)) * innerW),
    y: PAD.top + innerH - (b.total / max) * innerH,
  }))
  const line = smoothPath(points)
  const area =
    line +
    ` L ${points[points.length - 1]?.x ?? PAD.left} ${PAD.top + innerH}` +
    ` L ${points[0]?.x ?? PAD.left} ${PAD.top + innerH} Z`

  const labelEvery = Math.ceil(buckets.length / 8)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="График по дням">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.02 }} />
        </linearGradient>
      </defs>
      {[0.33, 0.66, 1].map((f) => (
        <line
          key={f}
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + innerH * (1 - f)}
          y2={PAD.top + innerH * (1 - f)}
          style={{ stroke: 'hsl(var(--chart-grid))' }}
          strokeDasharray="3 4"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill="url(#areaGrad)" />
      <path
        d={line}
        fill="none"
        style={{ stroke: 'hsl(var(--primary-deep))' }}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {points.map((p, i) =>
        buckets[i].total > 0 && buckets[i].total === max ? (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            style={{ fill: 'hsl(var(--primary-deep))', stroke: 'hsl(var(--background))' }}
            strokeWidth="2"
          />
        ) : null,
      )}
      {points.map((p, i) =>
        buckets[i].key && buckets[i].key === selectedDay && buckets[i].total !== max ? (
          <circle
            key={`sel-${i}`}
            cx={p.x}
            cy={p.y}
            r="4"
            style={{ fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))' }}
            strokeWidth="2"
          />
        ) : null,
      )}
      {buckets.map((b, i) =>
        i % labelEvery === 0 ? (
          <text
            key={i}
            x={points[i].x}
            y={H - 6}
            textAnchor="middle"
            fontSize="10"
            style={{ fill: 'hsl(var(--muted-foreground))' }}
          >
            {b.label}
          </text>
        ) : null,
      )}
      {onSelectDay &&
        buckets.map((b, i) => {
          if (!b.key) return null
          const step = buckets.length > 1 ? innerW / (buckets.length - 1) : innerW
          const x = Math.max(PAD.left, points[i].x - step / 2)
          const w = Math.min(step, PAD.left + innerW - x)
          return (
            <rect
              key={`hit-${b.key}`}
              x={x}
              y={0}
              width={w}
              height={H}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => onSelectDay(b.key!)}
            >
              <title>{`${b.label}: ${formatValue(b.total)}`}</title>
            </rect>
          )
        })}
    </svg>
  )
}

interface CatSlice {
  id: string
  name: string
  color: string
  total: number
  share: number
}

function DonutChart({
  slices,
  total,
  selectedId,
  onSelect,
  formatValue,
}: {
  slices: CatSlice[]
  total: number
  selectedId: string | null
  onSelect: (id: string | null) => void
  formatValue: (n: number) => string
}) {
  const R = 62
  const CIRC = 2 * Math.PI * R
  let offset = 0
  const selIdx = slices.findIndex((s) => s.id === selectedId)
  const displayIdx = selIdx >= 0 ? selIdx : 0
  const current = slices[displayIdx]

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          <circle cx="80" cy="80" r={R} fill="none" style={{ stroke: 'hsl(var(--muted))' }} strokeWidth="18" />
          {slices.map((s, i) => {
            const frac = s.share
            const dash = `${Math.max(0, frac * CIRC - 2)} ${CIRC}`
            const el = (
              <circle
                key={s.id}
                cx="80"
                cy="80"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={i === displayIdx ? 22 : 18}
                strokeDasharray={dash}
                strokeDashoffset={-offset * CIRC}
                strokeLinecap="butt"
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelect(s.id === selectedId ? null : s.id)}
                opacity={i === displayIdx ? 1 : 0.75}
              >
                <title>{`${s.name}: ${formatValue(s.total)}`}</title>
              </circle>
            )
            offset += frac
            return el
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="max-w-24 truncate text-xs text-muted-foreground">
            {current?.name ?? '—'}
          </span>
          <span className="text-xl font-bold tabular-nums">
            {formatValue(current?.total ?? total)}
          </span>
          <span className="text-xs text-muted-foreground">
            {current ? `${Math.round(current.share * 100)}%` : ''}
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
        {slices.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id === selectedId ? null : s.id)}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99] ${
              s.id === selectedId ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
          >
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {Math.round(s.share * 100)}%
            </span>
            <span className="shrink-0 text-sm font-medium tabular-nums">
              {formatValue(s.total)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface StatsPanelProps {
  items: StatItem[]
  categories: Category[]
  formatValue: (n: number) => string
  selectedDay: string
  onSelectDay: (day: string) => void
  selectedCategory: string | null
  onSelectCategory: (id: string | null) => void
  emptyCategoryHint?: string
}

export default function StatsPanel({
  items,
  categories,
  formatValue,
  selectedDay,
  onSelectDay,
  selectedCategory,
  onSelectCategory,
}: StatsPanelProps) {
  const [view, setView] = useState<ViewMode>('days')
  const [period, setPeriod] = useState<Period>('30d')

  const filtered = useMemo(() => {
    if (period === 'all') return items
    const start = dayKey(new Date(Date.now() - (period === '7d' ? 6 : 29) * 86400000))
    return items.filter((it) => dayKey(new Date(it.date)) >= start)
  }, [items, period])

  const buckets = useBuckets(items, period)

  const slices = useMemo<CatSlice[]>(() => {
    const totals = new Map<string, number>()
    let uncategorized = 0
    let sum = 0
    for (const it of filtered) {
      sum += it.value
      if (it.categoryId && categories.some((c) => c.id === it.categoryId)) {
        totals.set(it.categoryId, (totals.get(it.categoryId) ?? 0) + it.value)
      } else {
        uncategorized += it.value
      }
    }
    if (sum === 0) return []
    const list = categories
      .filter((c) => (totals.get(c.id) ?? 0) > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        total: totals.get(c.id) ?? 0,
        share: (totals.get(c.id) ?? 0) / sum,
      }))
    if (uncategorized > 0) {
      list.push({ id: 'none', name: 'Без категории', color: '#78716c', total: uncategorized, share: uncategorized / sum })
    }
    return list.sort((a, b) => b.total - a.total)
  }, [filtered, categories])

  const periodTotal = filtered.reduce((s, it) => s + it.value, 0)
  const avgPerDay =
    buckets.length > 0 ? buckets.reduce((s, b) => s + b.total, 0) / buckets.length : 0
  const bestDay = buckets.reduce<Bucket | null>(
    (best, b) => (b.total > 0 && (!best || b.total > best.total) ? b : best),
    null,
  )

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-background p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`min-h-10 rounded-lg text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] ${
                view === v.id ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`min-h-9 flex-1 rounded-full text-xs font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95 ${
                period === p.id
                  ? 'bg-primary/15 text-deep'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Статистика появится после первой записи
        </p>
      ) : view === 'days' ? (
        <div className="flex flex-col gap-4">
          <DaysChart
            buckets={buckets}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            formatValue={formatValue}
          />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-background p-3">
              <p className="text-[11px] text-muted-foreground">За период</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatValue(periodTotal)}</p>
            </div>
            <div className="rounded-xl bg-background p-3">
              <p className="text-[11px] text-muted-foreground">В среднем/день</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatValue(Math.round(avgPerDay * 10) / 10)}</p>
            </div>
            <div className="rounded-xl bg-background p-3">
              <p className="text-[11px] text-muted-foreground">Максимум</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">
                {formatValue(bestDay?.total ?? 0)}
              </p>
            </div>
          </div>
        </div>
      ) : slices.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          За выбранный период записей не было
        </p>
      ) : (
        <DonutChart
          slices={slices}
          total={periodTotal}
          selectedId={selectedCategory}
          onSelect={onSelectCategory}
          formatValue={formatValue}
        />
      )}
    </section>
  )
}
