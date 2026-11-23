import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Moon,
  Plus,
  Settings,
  Sun,
  Tags,
  Users,
  X,
} from 'lucide-react'
import type { Category, WorkEntry, Worker } from '@/types'
import {
  loadCategories,
  loadPurchases,
  loadWorkEntries,
  loadWorkers,
  loadWorkTypes,
  saveCategories,
  savePurchases,
  saveWorkEntries,
  saveWorkers,
  saveWorkTypes,
  uid,
} from '@/lib/storage'
import {
  dayKey,
  entryHours,
  formatDayLabel,
  formatHours,
  formatMonthLabel,
  formatShortDate,
  formatTime,
  parseDayKey,
} from '@/lib/format'
import { DayBars } from '@/components/StatsBars'
import StatsPanel from '@/components/StatsPanel'
import ModeSwitch from '@/components/ModeSwitch'
import TimeEntryForm, { type TimeEntryDraft } from '@/components/TimeEntryForm'
import TimeEntryDetail from '@/components/TimeEntryDetail'
import WorkerManager from '@/components/WorkerManager'
import CategoryManager from '@/components/CategoryManager'
import SettingsMenu from '@/components/SettingsMenu'
import type { BackupData } from '@/lib/export'

function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}

function TimeCard({
  e,
  workers,
  workTypes,
  showDate,
  onOpen,
}: {
  e: WorkEntry
  workers: Worker[]
  workTypes: Category[]
  showDate?: boolean
  onOpen: () => void
}) {
  const entryWorkers = workers.filter((w) => e.workerIds.includes(w.id))
  const first = entryWorkers[0]
  const type = workTypes.find((t) => t.id === e.typeId)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99]"
    >
      <span
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
        style={{
          backgroundColor: `${first?.color ?? '#78716c'}22`,
          color: first?.color ?? '#a8a29e',
        }}
      >
        {(first?.name ?? '?').trim().charAt(0).toUpperCase()}
        {entryWorkers.length > 1 && (
          <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
            +{entryWorkers.length - 1}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {entryWorkers.length > 0
            ? entryWorkers.map((w) => w.name).join(', ')
            : 'Без исполнителя'}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {type && (
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: type.color }}
              />
              {type.name}
            </span>
          )}
          <span className="tabular-nums">
            {showDate ? `${formatShortDate(e.start)} · ` : ''}
            {formatTime(e.start)}–{formatTime(e.end)}
          </span>
        </span>
      </span>
      <span className="shrink-0 font-semibold tabular-nums">{formatHours(entryHours(e))}</span>
    </button>
  )
}

export default function TimeHome() {
  const [workers, setWorkers] = useState<Worker[]>(loadWorkers)
  const [workTypes, setWorkTypes] = useState<Category[]>(loadWorkTypes)
  const [entries, setEntries] = useState<WorkEntry[]>(loadWorkEntries)
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()))
  const [filter, setFilter] = useState<{ kind: 'type' | 'person'; id: string } | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'hours'>('date')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WorkEntry | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [workersOpen, setWorkersOpen] = useState(false)
  const [typesOpen, setTypesOpen] = useState(false)
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

  useEffect(() => saveWorkers(workers), [workers])
  useEffect(() => saveWorkTypes(workTypes), [workTypes])
  useEffect(() => saveWorkEntries(entries), [entries])

  const totalAll = useMemo(() => entries.reduce((s, e) => s + entryHours(e), 0), [entries])

  const statItems = useMemo(
    () => entries.map((e) => ({ date: e.start, value: entryHours(e), categoryId: e.typeId })),
    [entries],
  )

  const personItems = useMemo(
    () =>
      entries.flatMap((e) =>
        e.workerIds.map((id) => ({ date: e.start, value: entryHours(e), categoryId: id })),
      ),
    [entries],
  )

  const peopleCategories = useMemo(
    () => workers.map((w) => ({ id: w.id, name: w.name, color: w.color })),
    [workers],
  )

  const monthKey = selectedDay.slice(0, 7)
  const totalMonth = useMemo(
    () =>
      entries
        .filter((e) => dayKey(new Date(e.start)).startsWith(monthKey))
        .reduce((s, e) => s + entryHours(e), 0),
    [entries, monthKey],
  )

  const dayEntries = useMemo(
    () =>
      entries
        .filter((e) => dayKey(new Date(e.start)) === selectedDay)
        .sort((a, b) => b.start.localeCompare(a.start)),
    [entries, selectedDay],
  )
  const totalDay = dayEntries.reduce((s, e) => s + entryHours(e), 0)

  const filteredEntries = useMemo(() => {
    if (filter === null) return []
    const list = entries.filter((e) => {
      if (filter.kind === 'person') {
        if (filter.id === 'none')
          return e.workerIds.length === 0 || !e.workerIds.some((id) => workers.some((w) => w.id === id))
        return e.workerIds.includes(filter.id)
      }
      if (filter.id === 'none')
        return !e.typeId || !workTypes.some((t) => t.id === e.typeId)
      return e.typeId === filter.id
    })
    return list.sort((a, b) =>
      sortBy === 'date' ? b.start.localeCompare(a.start) : entryHours(b) - entryHours(a),
    )
  }, [entries, filter, sortBy, workTypes, workers])

  const activeFilter = useMemo(() => {
    if (filter === null) return null
    if (filter.kind === 'person') {
      if (filter.id === 'none') return { name: 'Без человека', color: '#78716c' }
      const w = workers.find((x) => x.id === filter.id)
      return { name: w?.name ?? 'Человек', color: w?.color ?? '#78716c' }
    }
    if (filter.id === 'none') return { name: 'Без типа', color: '#78716c' }
    const type = workTypes.find((t) => t.id === filter.id)
    return { name: type?.name ?? 'Тип занятости', color: type?.color ?? '#78716c' }
  }, [filter, workTypes, workers])

  const filterTotal = filteredEntries.reduce((s, e) => s + entryHours(e), 0)

  const detail = entries.find((e) => e.id === detailId) ?? null

  const shiftDay = (delta: number) => {
    const d = parseDayKey(selectedDay)
    d.setDate(d.getDate() + delta)
    setSelectedDay(dayKey(d))
  }

  const selectDayFromChart = (day: string) => {
    setSelectedDay(day)
    setFilter(null)
  }

  const openDatePicker = () => {
    const el = dateJumpRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') el.showPicker()
    else el.click()
  }

  const addEntry = (draft: TimeEntryDraft) => {
    setEntries((prev) => [{ ...draft, id: uid(), createdAt: Date.now() } as WorkEntry, ...prev])
    setSelectedDay(dayKey(new Date(draft.start)))
  }

  const updateEntry = (draft: TimeEntryDraft) => {
    if (!editing) return
    setEntries((prev) => prev.map((e) => (e.id === editing.id ? { ...e, ...draft } : e)))
    setSelectedDay(dayKey(new Date(draft.start)))
    setEditing(null)
  }

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setDetailId(null)
  }

  const clearHistory = () => {
    setEntries([])
    setDetailId(null)
  }

  const importBackup = (data: BackupData) => {
    setEntries((prev) => {
      const existing = new Set(prev.map((e) => e.id))
      const fresh = data.workEntries.filter((e) => !existing.has(e.id))
      return [...fresh, ...prev]
    })
    setWorkers((prev) => {
      const existing = new Set(prev.map((w) => w.id))
      const fresh = data.workers.filter((w) => !existing.has(w.id))
      return [...prev, ...fresh]
    })
    setWorkTypes((prev) => {
      const existing = new Set(prev.map((t) => t.id))
      const fresh = data.workTypes.filter((t) => !existing.has(t.id))
      return [...prev, ...fresh]
    })
    const storedPurchases = loadPurchases()
    const purchaseIds = new Set(storedPurchases.map((p) => p.id))
    savePurchases([...data.purchases.filter((p) => !purchaseIds.has(p.id)), ...storedPurchases])
    const storedCategories = loadCategories()
    const categoryIds = new Set(storedCategories.map((c) => c.id))
    saveCategories([...storedCategories, ...data.categories.filter((c) => !categoryIds.has(c.id))])
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-deep">
            <Clock className="h-5 w-5" />
          </span>
          <h1 className="text-lg font-bold tracking-tight">Смета времени</h1>
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
            onClick={() => setWorkersOpen(true)}
            aria-label="Люди"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
          >
            <Users className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setTypesOpen(true)}
            aria-label="Типы занятости"
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
        <ModeSwitch mode="time" />

        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Всего часов</p>
          <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-deep">
            {formatHours(totalAll)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-background p-3">
              <p className="text-xs text-muted-foreground">{formatMonthLabel(monthKey)}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatHours(totalMonth)}
              </p>
            </div>
            <div className="rounded-xl bg-background p-3">
              <p className="text-xs text-muted-foreground">Выбранный день</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatHours(totalDay)}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <DayBars
              items={statItems}
              selectedDay={selectedDay}
              onSelectDay={selectDayFromChart}
              formatValue={formatHours}
            />
          </div>
        </section>

        {entries.length > 0 && (
          <StatsPanel
            items={statItems}
            categories={workTypes}
            formatValue={formatHours}
            selectedDay={selectedDay}
            onSelectDay={selectDayFromChart}
            selectedCategory={filter?.kind === 'type' ? filter.id : null}
            onSelectCategory={(id) => setFilter(id ? { kind: 'type', id } : null)}
            people={{
              items: personItems,
              categories: peopleCategories,
              label: 'По людям',
              emptyLabel: 'Без человека',
              selectedId: filter?.kind === 'person' ? filter.id : null,
              onSelect: (id) => setFilter(id ? { kind: 'person', id } : null),
            }}
          />
        )}

        <section className="flex flex-col gap-3">
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="font-medium">Пока нет ни одной записи</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Нажмите «+», чтобы добавить первую запись времени
              </p>
            </div>
          ) : filter === null ? (
            <>
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
                  className="w-full min-h-11 rounded-xl border border-dashed border-input text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99]"
                >
                  Вернуться к сегодняшнему дню
                </button>
              )}
              {dayEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-muted-foreground">В этот день записей не было</p>
                </div>
              ) : (
                dayEntries.map((e) => (
                  <TimeCard
                    key={e.id}
                    e={e}
                    workers={workers}
                    workTypes={workTypes}
                    onOpen={() => setDetailId(e.id)}
                  />
                ))
              )}
            </>
          ) : (
            <>
              {activeFilter && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full"
                    style={{ backgroundColor: activeFilter.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{activeFilter.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {filteredEntries.length}{' '}
                      {plural(filteredEntries.length, ['запись', 'записи', 'записей'])} ·{' '}
                      {formatHours(filterTotal)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilter(null)}
                    aria-label="Сбросить фильтр"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1">
                {(
                  [
                    { id: 'date', label: 'Сначала новые' },
                    { id: 'hours', label: 'Сначала длинные' },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSortBy(s.id)}
                    className={`min-h-9 rounded-lg text-xs font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] ${
                      sortBy === s.id
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {filteredEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    По этому фильтру пока нет записей
                  </p>
                </div>
              ) : (
                filteredEntries.map((e) => (
                  <TimeCard
                    key={e.id}
                    e={e}
                    workers={workers}
                    workTypes={workTypes}
                    showDate
                    onOpen={() => setDetailId(e.id)}
                  />
                ))
              )}
            </>
          )}
        </section>
      </main>

      <button
        type="button"
        onClick={() => {
          setEditing(null)
          setFormOpen(true)
        }}
        aria-label="Добавить запись времени"
        className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-90"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      {formOpen && (
        <TimeEntryForm
          key={editing?.id ?? 'new'}
          open={formOpen}
          initial={editing}
          workers={workers}
          workTypes={workTypes}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSubmit={editing ? updateEntry : addEntry}
          onCreateWorker={(w) => setWorkers((prev) => [...prev, w])}
          onCreateType={(t) => setWorkTypes((prev) => [...prev, t])}
        />
      )}

      {detail && (
        <TimeEntryDetail
          key={detail.id}
          entry={detail}
          workers={workers}
          workTypes={workTypes}
          onClose={() => setDetailId(null)}
          onEdit={(e) => {
            setDetailId(null)
            setEditing(e)
            setFormOpen(true)
          }}
          onDelete={deleteEntry}
        />
      )}

      <WorkerManager
        open={workersOpen}
        workers={workers}
        onClose={() => setWorkersOpen(false)}
        onSave={setWorkers}
      />

      <CategoryManager
        open={typesOpen}
        categories={workTypes}
        onClose={() => setTypesOpen(false)}
        onSave={setWorkTypes}
        title="Типы занятости"
        namePlaceholder="Название типа занятости"
        addLabel="Новый тип"
      />

      <SettingsMenu
        open={settingsOpen}
        mode="time"
        onClose={() => setSettingsOpen(false)}
        onImport={importBackup}
        onClear={clearHistory}
      />
    </div>
  )
}
