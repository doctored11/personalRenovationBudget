import type { Category, Purchase } from '@/types'
import { SOURCE_LABELS } from '@/types'

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

export function exportJson(purchases: Purchase[], categories: Category[]) {
  const payload = {
    app: 'remont-expenses',
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    purchases,
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

export interface BackupData {
  purchases: Purchase[]
  categories: Category[]
}

export function parseBackup(text: string): BackupData {
  const data = JSON.parse(text)
  if (
    !data ||
    !Array.isArray(data.purchases) ||
    !Array.isArray(data.categories) ||
    !data.purchases.every(
      (p: Purchase) =>
        typeof p.id === 'string' && typeof p.name === 'string' && typeof p.amount === 'number',
    ) ||
    !data.categories.every(
      (c: Category) => typeof c.id === 'string' && typeof c.name === 'string',
    )
  ) {
    throw new Error('invalid backup')
  }
  return { purchases: data.purchases, categories: data.categories }
}
