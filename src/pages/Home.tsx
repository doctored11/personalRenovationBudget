import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe,
  Hammer,
  HelpCircle,
  Moon,
  Plus,
  Settings,
  Store,
  Sun,
  Tags,
} from 'lucide-react'
import type { Category, Purchase } from '@/types'
import {
  loadCategories,
  loadPurchases,
  saveCategories,
  savePurchases,
  uid,
} from '@/lib/storage'
import {
  dayKey,
  formatDayLabel,
  formatMoney,
  formatMonthLabel,
  formatTime,
  parseDayKey,
} from '@/lib/format'
import { DayBars } from '@/components/StatsBars'
import StatsPanel from '@/components/StatsPanel'
import PurchaseForm, { type PurchaseDraft } from '@/components/PurchaseForm'
import PurchaseDetail from '@/components/PurchaseDetail'
import CategoryManager from '@/components/CategoryManager'
import SettingsMenu from '@/components/SettingsMenu'

const SOURCE_ICONS = { offline: Store, online: Globe, unknown: HelpCircle }

export default function Home() {
  const [purchases, setPurchases] = useState<Purchase[]>(loadPurchases)
  const [categories, setCategories] = useState<Category[]>(loadCategories)
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()))

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Purchase | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [catsOpen, setCatsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const dateJumpRef = useRef<HTMLInputElement>(null)

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('remont.theme', next ? 'dark' : 'light')
    } catch {
    }
  }

  useEffect(() => savePurchases(purchases), [purchases])
  useEffect(() => saveCategories(categories), [categories])

  const totalAll = useMemo(() => purchases.reduce((s, p) => s + p.amount, 0), [purchases])

  const monthKey = selectedDay.slice(0, 7)
  const totalMonth = useMemo(
    () =>
      purchases
        .filter((p) => dayKey(new Date(p.date)).startsWith(monthKey))
        .reduce((s, p) => s + p.amount, 0),
    [purchases, monthKey],
  )

  const dayPurchases = useMemo(
    () =>
      purchases
        .filter((p) => dayKey(new Date(p.date)) === selectedDay)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [purchases, selectedDay],
  )
  const totalDay = dayPurchases.reduce((s, p) => s + p.amount, 0)

  const detail = purchases.find((p) => p.id === detailId) ?? null

  const shiftDay = (delta: number) => {
    const d = parseDayKey(selectedDay)
    d.setDate(d.getDate() + delta)
    setSelectedDay(dayKey(d))
  }

  const openDatePicker = () => {
    const el = dateJumpRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') el.showPicker()
    else el.click()
  }

  const addPurchase = (draft: PurchaseDraft) => {
    setPurchases((prev) => [
      { ...draft, id: uid(), createdAt: Date.now() } as Purchase,
      ...prev,
    ])
    setSelectedDay(dayKey(new Date(draft.date)))
  }

  const updatePurchase = (draft: PurchaseDraft) => {
    if (!editing) return
    setPurchases((prev) =>
      prev.map((p) => (p.id === editing.id ? { ...p, ...draft } : p)),
    )
    setSelectedDay(dayKey(new Date(draft.date)))
    setEditing(null)
  }

  const deletePurchase = (id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id))
    setDetailId(null)
  }

  const clearHistory = () => {
    setPurchases([])
    setDetailId(null)
  }

  const importBackup = (data: { purchases: Purchase[]; categories: Category[] }) => {
    setPurchases((prev) => {
      const existing = new Set(prev.map((p) => p.id))
      const fresh = data.purchases.filter((p) => !existing.has(p.id))
      return [...fresh, ...prev]
    })
    setCategories((prev) => {
      const existing = new Set(prev.map((c) => c.id))
      const fresh = data.categories.filter((c) => !existing.has(c.id))
      return [...prev, ...fresh]
    })
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-deep">
            <Hammer className="h-5 w-5" />
          </span>
          <h1 className="text-lg font-bold tracking-tight">Траты на ремонт</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => setCatsOpen(true)}
            aria-label="Категории"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
          >
            <Tags className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Данные и настройки"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-5 px-4 pt-4">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Всего потрачено</p>
          <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-deep">
            {formatMoney(totalAll)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-background p-3">
              <p className="text-xs text-muted-foreground">{formatMonthLabel(monthKey)}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatMoney(totalMonth)}
              </p>
            </div>
            <div className="rounded-xl bg-background p-3">
              <p className="text-xs text-muted-foreground">Выбранный день</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatMoney(totalDay)}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <DayBars
              purchases={purchases}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          </div>
        </section>

        {purchases.length > 0 && (
          <StatsPanel purchases={purchases} categories={categories} />
        )}

        <section>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftDay(-1)}
              aria-label="Предыдущий день"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={openDatePicker}
              className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-2 text-center font-medium transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98]"
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{formatDayLabel(selectedDay)}</span>
            </button>
            <button
              type="button"
              onClick={() => shiftDay(1)}
              aria-label="Следующий день"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <input
              ref={dateJumpRef}
              type="date"
              value={selectedDay}
              onChange={(e) => e.target.value && setSelectedDay(e.target.value)}
              className="pointer-events-none absolute h-0 w-0 opacity-0"
              tabIndex={-1}
              aria-hidden
            />
          </div>
          {selectedDay !== dayKey(new Date()) && (
            <button
              type="button"
              onClick={() => setSelectedDay(dayKey(new Date()))}
              className="mt-2 w-full min-h-11 rounded-xl border border-dashed border-input text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99]"
            >
              Вернуться к сегодняшнему дню
            </button>
          )}
        </section>

        <section className="flex flex-col gap-2">
          {purchases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="font-medium">Пока нет ни одной траты</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Нажмите «+», чтобы добавить первую покупку
              </p>
            </div>
          ) : dayPurchases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">В этот день трат не было</p>
            </div>
          ) : (
            dayPurchases.map((p) => {
              const cat = categories.find((c) => c.id === p.categoryId)
              const SourceIcon = SOURCE_ICONS[p.source]
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDetailId(p.id)}
                  className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99]"
                >
                  {p.photo ? (
                    <img
                      src={p.photo}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                      style={{
                        backgroundColor: `${cat?.color ?? '#78716c'}22`,
                        color: cat?.color ?? '#a8a29e',
                      }}
                    >
                      {p.name.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {cat && (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <SourceIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="tabular-nums">{formatTime(p.date)}</span>
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatMoney(p.amount)}
                  </span>
                </button>
              )
            })
          )}
        </section>
      </main>

      <button
        type="button"
        onClick={() => {
          setEditing(null)
          setFormOpen(true)
        }}
        aria-label="Добавить покупку"
        className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-deep-foreground shadow-lg shadow-primary/30 transition-transform hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-90"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      {formOpen && (
        <PurchaseForm
          key={editing?.id ?? 'new'}
          open={formOpen}
          initial={editing}
          categories={categories}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSubmit={editing ? updatePurchase : addPurchase}
        />
      )}

      {detail && (
        <PurchaseDetail
          key={detail.id}
          purchase={detail}
          categories={categories}
          onClose={() => setDetailId(null)}
          onEdit={(p) => {
            setDetailId(null)
            setEditing(p)
            setFormOpen(true)
          }}
          onDelete={deletePurchase}
        />
      )}

      <CategoryManager
        open={catsOpen}
        categories={categories}
        onClose={() => setCatsOpen(false)}
        onSave={setCategories}
      />

      <SettingsMenu
        open={settingsOpen}
        purchases={purchases}
        categories={categories}
        onClose={() => setSettingsOpen(false)}
        onImport={importBackup}
        onClear={clearHistory}
      />
    </div>
  )
}
