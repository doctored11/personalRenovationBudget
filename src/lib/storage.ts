import type { Category, Purchase } from '@/types'

const PURCHASES_KEY = 'remont.purchases.v1'
const CATEGORIES_KEY = 'remont.categories.v1'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-materials', name: 'Материалы', color: '#f59e0b' },
  { id: 'cat-tools', name: 'Инструменты', color: '#38bdf8' },
  { id: 'cat-furniture', name: 'Мебель', color: '#a78bfa' },
  { id: 'cat-work', name: 'Работы', color: '#34d399' },
  { id: 'cat-other', name: 'Прочее', color: '#f87171' },
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

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
