import type { Category, Purchase, Worker, WorkEntry } from '@/types'
import { CATEGORY_PALETTE } from '@/lib/palette'

const PURCHASES_KEY = 'remont.purchases.v1'
const CATEGORIES_KEY = 'remont.categories.v1'
const WORKERS_KEY = 'remont.workers.v1'
const WORK_TYPES_KEY = 'remont.workTypes.v1'
const WORK_ENTRIES_KEY = 'remont.workEntries.v1'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-materials', name: 'Материалы', color: '#f59e0b' },
  { id: 'cat-tools', name: 'Инструменты', color: '#38bdf8' },
  { id: 'cat-furniture', name: 'Мебель', color: '#a78bfa' },
  { id: 'cat-work', name: 'Работы', color: '#34d399' },
  { id: 'cat-other', name: 'Прочее', color: '#f87171' },
]

const DEFAULT_WORK_TYPES: Category[] = [
  { id: 'wtype-demontazh', name: 'Демонтаж', color: '#f59e0b' },
  { id: 'wtype-chernovye', name: 'Черновые работы', color: '#38bdf8' },
  { id: 'wtype-electro', name: 'Электрика', color: '#a78bfa' },
  { id: 'wtype-santech', name: 'Сантехника', color: '#34d399' },
  { id: 'wtype-otdelka', name: 'Отделка', color: '#a3e635' },
  { id: 'wtype-prochee', name: 'Прочее', color: '#94a3b8' },
]

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadPurchases(): Purchase[] {
  return safeParse<Purchase[]>(localStorage.getItem(PURCHASES_KEY), [])
}

export function savePurchases(purchases: Purchase[]) {
  try {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases))
  } catch {
  }
}

export function loadCategories(): Category[] {
  const cats = safeParse<Category[]>(localStorage.getItem(CATEGORIES_KEY), [])
  if (cats.length === 0) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES))
    return DEFAULT_CATEGORIES
  }
  return cats
}

export function saveCategories(categories: Category[]) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

export function loadWorkers(): Worker[] {
  const workers = safeParse<Worker[]>(localStorage.getItem(WORKERS_KEY), [])
  return workers.map((w, i) => ({
    ...w,
    color: w.color ?? CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
    position: w.position ?? '',
  }))
}

export function saveWorkers(workers: Worker[]) {
  localStorage.setItem(WORKERS_KEY, JSON.stringify(workers))
}

export function loadWorkTypes(): Category[] {
  const types = safeParse<Category[]>(localStorage.getItem(WORK_TYPES_KEY), [])
  if (types.length === 0) {
    localStorage.setItem(WORK_TYPES_KEY, JSON.stringify(DEFAULT_WORK_TYPES))
    return DEFAULT_WORK_TYPES
  }
  return types
}

export function saveWorkTypes(types: Category[]) {
  localStorage.setItem(WORK_TYPES_KEY, JSON.stringify(types))
}

export function loadWorkEntries(): WorkEntry[] {
  const entries = safeParse<WorkEntry[]>(localStorage.getItem(WORK_ENTRIES_KEY), [])
  return entries.map((e) => {
    const legacy = e as WorkEntry & { workerId?: string | null }
    return {
      ...e,
      workerIds: Array.isArray(e.workerIds)
        ? e.workerIds
        : legacy.workerId
          ? [legacy.workerId]
          : [],
    }
  })
}

export function saveWorkEntries(entries: WorkEntry[]) {
  localStorage.setItem(WORK_ENTRIES_KEY, JSON.stringify(entries))
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
