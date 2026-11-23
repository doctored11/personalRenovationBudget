export type Source = 'unknown' | 'offline' | 'online'

export interface Category {
  id: string
  name: string
  color: string
}

export interface Purchase {
  id: string
  name: string
  amount: number
  categoryId: string | null
  date: string
  source: Source
  note: string
  photo?: string
  createdAt: number
}

export const SOURCE_LABELS: Record<Source, string> = {
  unknown: 'Неизвестно',
  offline: 'Офлайн',
  online: 'Онлайн',
}

export interface Worker {
  id: string
  name: string
  position: string
}

export interface WorkEntry {
  id: string
  workerId: string | null
  typeId: string | null
  start: string
  end: string
  note: string
  createdAt: number
}
