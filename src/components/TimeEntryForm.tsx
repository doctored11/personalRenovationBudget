import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import type { Category, Worker, WorkEntry } from '@/types'
import { formatHours } from '@/lib/format'
import { CATEGORY_PALETTE } from '@/lib/palette'
import Modal from '@/components/Modal'

export interface TimeEntryDraft {
  workerId: string | null
  typeId: string | null
  start: string
  end: string
  note: string
}

interface TimeEntryFormProps {
  open: boolean
  initial: WorkEntry | null
  workers: Worker[]
  workTypes: Category[]
  onClose: () => void
  onSubmit: (draft: TimeEntryDraft) => void
  onCreateWorker: (worker: Worker) => void
  onCreateType: (type: Category) => void
}

const inputCls =
  'w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus-visible:outline-none'

function toDateInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function todayInput(): string {
  return toDateInput(new Date().toISOString())
}

export default function TimeEntryForm({
  open,
  initial,
  workers,
  workTypes,
  onClose,
  onSubmit,
  onCreateWorker,
  onCreateType,
}: TimeEntryFormProps) {
  const [workerId, setWorkerId] = useState<string | null>(initial?.workerId ?? null)
  const [typeId, setTypeId] = useState<string | null>(initial?.typeId ?? null)
  const [date, setDate] = useState(initial ? toDateInput(initial.start) : todayInput())
  const [startTime, setStartTime] = useState(initial ? toTimeInput(initial.start) : '09:00')
  const [endTime, setEndTime] = useState(initial ? toTimeInput(initial.end) : '18:00')
  const [note, setNote] = useState(initial?.note ?? '')
  const [errors, setErrors] = useState<{ worker?: string; time?: string }>({})

  const [workerFormOpen, setWorkerFormOpen] = useState(false)
  const [newWorkerName, setNewWorkerName] = useState('')
  const [newWorkerPosition, setNewWorkerPosition] = useState('')

  const [typeFormOpen, setTypeFormOpen] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeColor, setNewTypeColor] = useState(CATEGORY_PALETTE[7])

  const createWorker = () => {
    const trimmed = newWorkerName.trim()
    if (!trimmed) return
    const worker: Worker = {
      id: `wrk-${Date.now().toString(36)}`,
      name: trimmed,
      position: newWorkerPosition.trim(),
    }
    onCreateWorker(worker)
    setWorkerId(worker.id)
    setWorkerFormOpen(false)
    setNewWorkerName('')
    setNewWorkerPosition('')
    setErrors((p) => ({ ...p, worker: undefined }))
  }

  const createType = () => {
    const trimmed = newTypeName.trim()
    if (!trimmed) return
    const type: Category = {
      id: `wtype-${Date.now().toString(36)}`,
      name: trimmed,
      color: newTypeColor,
    }
    onCreateType(type)
    setTypeId(type.id)
    setTypeFormOpen(false)
    setNewTypeName('')
  }

  const buildRange = (): { start: Date; end: Date } | null => {
    if (!date || !startTime || !endTime) return null
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const start = new Date(`${date}T00:00:00`)
    start.setHours(sh, sm, 0, 0)
    const end = new Date(`${date}T00:00:00`)
    end.setHours(eh, em, 0, 0)
    if (end.getTime() <= start.getTime()) {
      end.setDate(end.getDate() + 1)
    }
    return { start, end }
  }

  const range = buildRange()
  const hours = range ? (range.end.getTime() - range.start.getTime()) / 3600000 : 0

  const submit = () => {
    const next: typeof errors = {}
    if (!workerId) next.worker = 'Выберите человека'
    if (!range || hours <= 0 || hours > 24) next.time = 'Проверьте время начала и конца'
    setErrors(next)
    if (next.worker || next.time || !range) return
    onSubmit({
      workerId,
      typeId,
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      note: note.trim(),
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Редактировать запись' : 'Новая запись времени'}
    >
      <form
        className="flex flex-col gap-4 pb-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Человек</span>
          <div className="flex flex-wrap gap-2">
            {workers.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setWorkerId(w.id)
                  if (errors.worker) setErrors((p) => ({ ...p, worker: undefined }))
                }}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95 ${
                  workerId === w.id
                    ? 'border-foreground bg-secondary font-medium'
                    : 'border-input text-muted-foreground hover:border-ring'
                }`}
              >
                {w.name}
                {w.position && (
                  <span className="text-xs text-muted-foreground">{w.position}</span>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setWorkerFormOpen((v) => !v)}
              aria-label="Добавить человека"
              className="flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-input px-4 text-sm text-muted-foreground transition-all hover:border-ring hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Свой
            </button>
          </div>
          {workerFormOpen && (
            <div className="mt-1 flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
              <input
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                placeholder="Имя"
                aria-label="Имя нового человека"
                className={inputCls}
              />
              <input
                value={newWorkerPosition}
                onChange={(e) => setNewWorkerPosition(e.target.value)}
                placeholder="Должность"
                aria-label="Должность нового человека"
                className={inputCls}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    createWorker()
                  }
                }}
              />
              <button
                type="button"
                onClick={createWorker}
                disabled={!newWorkerName.trim()}
                className="min-h-11 rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Создать и выбрать
              </button>
            </div>
          )}
          {errors.worker && <p className="text-sm text-destructive">{errors.worker}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Тип занятости</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTypeId(null)}
              className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95 ${
                typeId === null
                  ? 'border-foreground bg-secondary font-medium'
                  : 'border-input text-muted-foreground hover:border-ring'
              }`}
            >
              Без типа
            </button>
            {workTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeId(t.id)}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95 ${
                  typeId === t.id
                    ? 'border-foreground bg-secondary font-medium'
                    : 'border-input text-muted-foreground hover:border-ring'
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                {t.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTypeFormOpen((v) => !v)}
              aria-label="Создать тип занятости"
              className="flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-input px-4 text-sm text-muted-foreground transition-all hover:border-ring hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Свой
            </button>
          </div>
          {typeFormOpen && (
            <div className="mt-1 flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
              <input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Название типа занятости"
                aria-label="Название типа занятости"
                className={inputCls}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    createType()
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTypeColor(color)}
                    aria-label={`Цвет ${color}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
                    style={{ backgroundColor: color }}
                  >
                    {newTypeColor === color && (
                      <Check className="h-4 w-4 text-black/70" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={createType}
                disabled={!newTypeName.trim()}
                className="min-h-11 rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Создать и выбрать
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tf-date" className="text-sm text-muted-foreground">
            Дата
          </label>
          <input
            id="tf-date"
            type="date"
            className={inputCls}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tf-start" className="text-sm text-muted-foreground">
              С
            </label>
            <input
              id="tf-start"
              type="time"
              className={inputCls}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tf-end" className="text-sm text-muted-foreground">
              До
            </label>
            <input
              id="tf-end"
              type="time"
              className={inputCls}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Длительность: <span className="font-medium text-foreground">{formatHours(hours)}</span>
          {range && range.end.getDate() !== range.start.getDate() && (
            <span> (захватывает следующий день)</span>
          )}
        </p>
        {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tf-note" className="text-sm text-muted-foreground">
            Заметка
          </label>
          <textarea
            id="tf-note"
            className={`${inputCls} min-h-20 resize-y`}
            placeholder="Что делали, объект, детали…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="mt-1 min-h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition-transform hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98]"
        >
          {initial ? 'Сохранить' : 'Добавить запись'}
        </button>
      </form>
    </Modal>
  )
}
