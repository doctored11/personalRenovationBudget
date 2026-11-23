import { useState } from 'react'
import { Pencil, Trash2, UserRound } from 'lucide-react'
import type { Category, Worker, WorkEntry } from '@/types'
import { dayKey, entryHours, formatDayLabel, formatHours, formatTime } from '@/lib/format'
import Modal from '@/components/Modal'

interface TimeEntryDetailProps {
  entry: WorkEntry | null
  workers: Worker[]
  workTypes: Category[]
  onClose: () => void
  onEdit: (e: WorkEntry) => void
  onDelete: (id: string) => void
}

export default function TimeEntryDetail({
  entry,
  workers,
  workTypes,
  onClose,
  onEdit,
  onDelete,
}: TimeEntryDetailProps) {
  const [confirming, setConfirming] = useState(false)
  if (!entry) return null

  const worker = workers.find((w) => w.id === entry.workerId)
  const type = workTypes.find((t) => t.id === entry.typeId)

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    onDelete(entry.id)
    setConfirming(false)
    onClose()
  }

  return (
    <Modal open={!!entry} onClose={onClose} title="Запись времени">
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-deep">
              <UserRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-xl font-semibold leading-snug">
                {worker?.name ?? 'Без имени'}
              </h3>
              {worker?.position && (
                <p className="truncate text-sm text-muted-foreground">{worker.position}</p>
              )}
            </div>
          </div>
          <span className="shrink-0 text-xl font-bold tabular-nums text-deep">
            {formatHours(entryHours(entry))}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {type ? (
            <span className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: type.color }} />
              {type.name}
            </span>
          ) : (
            <span className="rounded-full border border-border bg-secondary px-3 py-1.5 text-muted-foreground">
              Без типа
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {formatDayLabel(dayKey(new Date(entry.start)))} · {formatTime(entry.start)}–
          {formatTime(entry.end)}
        </p>

        {entry.note && (
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.note}</p>
          </div>
        )}

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEdit(entry)}
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
