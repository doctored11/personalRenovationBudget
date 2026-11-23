import type { Category, Purchase, Worker, WorkEntry } from '@/types'
import { SOURCE_LABELS } from '@/types'
import { entryHours } from '@/lib/format'

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function stamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function exportJson(
  purchases: Purchase[],
  categories: Category[],
  workers: Worker[],
  workTypes: Category[],
  workEntries: WorkEntry[],
) {
  const payload = {
    app: 'remont-expenses',
    version: 2,
    exportedAt: new Date().toISOString(),
    categories,
    purchases,
    workers,
    workTypes,
    workEntries,
  }
  download(`remont-backup-${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json')
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function exportCsv(purchases: Purchase[], categories: Category[]) {
  const catName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? 'Без категории'
  const rows = purchases
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => {
      const d = new Date(p.date)
      const pad = (n: number) => String(n).padStart(2, '0')
      const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
      const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
      return [
        csvCell(date),
        csvCell(time),
        csvCell(p.name),
        csvCell(catName(p.categoryId)),
        csvCell(String(p.amount).replace('.', ',')),
        csvCell(SOURCE_LABELS[p.source]),
        csvCell(p.note),
      ].join(';')
    })
  const header = ['Дата', 'Время', 'Название', 'Категория', 'Сумма', 'Источник', 'Заметка']
    .map(csvCell)
    .join(';')
  download(`remont-expenses-${stamp()}.csv`, '﻿' + [header, ...rows].join('\r\n'), 'text/csv')
}

export function exportTimeCsv(
  entries: WorkEntry[],
  workers: Worker[],
  workTypes: Category[],
) {
  const workerName = (id: string | null) => workers.find((w) => w.id === id)?.name ?? '—'
  const workerPosition = (id: string | null) =>
    workers.find((w) => w.id === id)?.position ?? ''
  const typeName = (id: string | null) =>
    workTypes.find((t) => t.id === id)?.name ?? 'Без типа'
  const rows = entries
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((e) => {
      const s = new Date(e.start)
      const en = new Date(e.end)
      const pad = (n: number) => String(n).padStart(2, '0')
      const date = `${pad(s.getDate())}.${pad(s.getMonth() + 1)}.${s.getFullYear()}`
      const from = `${pad(s.getHours())}:${pad(s.getMinutes())}`
      const to = `${pad(en.getHours())}:${pad(en.getMinutes())}`
      const hours = String(Math.round(entryHours(e) * 100) / 100).replace('.', ',')
      return [
        csvCell(date),
        csvCell(workerName(e.workerId)),
        csvCell(workerPosition(e.workerId)),
        csvCell(typeName(e.typeId)),
        csvCell(from),
        csvCell(to),
        csvCell(hours),
        csvCell(e.note),
      ].join(';')
    })
  const header = ['Дата', 'Человек', 'Должность', 'Тип занятости', 'С', 'До', 'Часов', 'Заметка']
    .map(csvCell)
    .join(';')
  download(`remont-time-${stamp()}.csv`, '﻿' + [header, ...rows].join('\r\n'), 'text/csv')
}

export interface BackupData {
  purchases: Purchase[]
  categories: Category[]
  workers: Worker[]
  workTypes: Category[]
  workEntries: WorkEntry[]
}

function isValidArray<T>(value: unknown, check: (item: T) => boolean): value is T[] {
  return Array.isArray(value) && value.every(check)
}

export function parseBackup(text: string): BackupData {
  const data = JSON.parse(text)
  const validPurchases =
    data &&
    isValidArray<Purchase>(
      data.purchases,
      (p) => typeof p.id === 'string' && typeof p.name === 'string' && typeof p.amount === 'number',
    ) &&
    isValidArray<Category>(
      data.categories,
      (c) => typeof c.id === 'string' && typeof c.name === 'string',
    )
  if (!validPurchases) {
    throw new Error('invalid backup')
  }
  const emptyCat = (v: unknown): Category[] =>
    isValidArray<Category>(v, (c) => typeof c.id === 'string' && typeof c.name === 'string')
      ? v
      : []
  return {
    purchases: data.purchases,
    categories: data.categories,
    workers: isValidArray<Worker>(
      data.workers,
      (w) => typeof w.id === 'string' && typeof w.name === 'string',
    )
      ? data.workers
      : [],
    workTypes: emptyCat(data.workTypes),
    workEntries: isValidArray<WorkEntry>(
      data.workEntries,
      (e) => typeof e.id === 'string' && typeof e.start === 'string' && typeof e.end === 'string',
    )
      ? data.workEntries
      : [],
  }
}
