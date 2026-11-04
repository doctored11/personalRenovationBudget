import { useState } from 'react'
import { Globe, HelpCircle, Pencil, Store, Trash2 } from 'lucide-react'
import type { Category, Purchase } from '@/types'
import { SOURCE_LABELS } from '@/types'
import { formatDayLabel, formatMoney, formatTime, dayKey } from '@/lib/format'
import Modal from '@/components/Modal'

interface PurchaseDetailProps {
  purchase: Purchase | null
  categories: Category[]
  onClose: () => void
  onEdit: (p: Purchase) => void
  onDelete: (id: string) => void
}

const SOURCE_ICONS = { offline: Store, online: Globe, unknown: HelpCircle }

export default function PurchaseDetail({
  purchase,
  categories,
  onClose,
  onEdit,
  onDelete,
}: PurchaseDetailProps) {
  const [confirming, setConfirming] = useState(false)
  if (!purchase) return null

  const category = categories.find((c) => c.id === purchase.categoryId)
  const SourceIcon = SOURCE_ICONS[purchase.source]

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    onDelete(purchase.id)
    setConfirming(false)
    onClose()
  }

  return (
    <Modal open={!!purchase} onClose={onClose} title="Покупка">
      <div className="flex flex-col gap-4 pb-2">
        {purchase.photo && (
          <img
            src={purchase.photo}
            alt={purchase.name}
            className="max-h-72 w-full rounded-xl border border-border object-cover"
          />
        )}

        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold leading-snug">{purchase.name}</h3>
          <span className="shrink-0 text-xl font-bold tabular-nums text-deep">
            {formatMoney(purchase.amount)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {category ? (
            <span className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </span>
          ) : (
            <span className="rounded-full border border-border bg-secondary px-3 py-1.5 text-muted-foreground">
              Без категории
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-muted-foreground">
            <SourceIcon className="h-4 w-4" />
            {SOURCE_LABELS[purchase.source]}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          {formatDayLabel(dayKey(new Date(purchase.date)))} · {formatTime(purchase.date)}
        </p>

        {purchase.note && (
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{purchase.note}</p>
          </div>
        )}

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEdit(purchase)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-input font-medium transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98]"
          >
            <Pencil className="h-4 w-4" />
            Изменить
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] ${
              confirming
                ? 'bg-destructive text-destructive-foreground hover:brightness-110'
                : 'border border-destructive/50 text-destructive hover:bg-destructive/10'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {confirming ? 'Точно удалить?' : 'Удалить'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
