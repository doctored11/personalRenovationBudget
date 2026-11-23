import { useState } from 'react'
import { Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import type { Worker } from '@/types'
import Modal from '@/components/Modal'

interface WorkerManagerProps {
  open: boolean
  workers: Worker[]
  onClose: () => void
  onSave: (workers: Worker[]) => void
}

interface EditState {
  id: string | null
  name: string
  position: string
}

const inputCls =
  'w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none placeholder:text-muted-foreground/60 focus:border-ring'

export default function WorkerManager({ open, workers, onClose, onSave }: WorkerManagerProps) {
  const [edit, setEdit] = useState<EditState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const startAdd = () => setEdit({ id: null, name: '', position: '' })
  const startEdit = (w: Worker) => setEdit({ id: w.id, name: w.name, position: w.position })

  const commitEdit = () => {
    if (!edit || !edit.name.trim()) return
    if (edit.id === null) {
      onSave([
        ...workers,
        {
          id: `wrk-${Date.now().toString(36)}`,
          name: edit.name.trim(),
          position: edit.position.trim(),
        },
      ])
    } else {
      onSave(
        workers.map((w) =>
          w.id === edit.id
            ? { ...w, name: edit.name.trim(), position: edit.position.trim() }
            : w,
        ),
      )
    }
    setEdit(null)
  }

  const remove = (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id)
      return
    }
    onSave(workers.filter((w) => w.id !== id))
    setDeletingId(null)
  }

  return (
    <Modal open={open} onClose={onClose} title="Люди">
      <div className="flex flex-col gap-2 pb-2">
        {workers.length === 0 && !edit && (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Добавьте тех, кто работает на объекте
          </p>
        )}
        {workers.map((w) => (
          <div
            key={w.id}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-background px-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-deep">
              <UserRound className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{w.name}</span>
              {w.position && (
                <span className="block truncate text-xs text-muted-foreground">{w.position}</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => startEdit(w)}
              aria-label={`Изменить ${w.name}`}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => remove(w.id)}
              aria-label={`Удалить ${w.name}`}
              className={`flex h-11 items-center justify-center rounded-full px-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95 ${
                deletingId === w.id
                  ? 'bg-destructive text-destructive-foreground'
                  : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
              }`}
            >
              {deletingId === w.id ? (
                <span className="text-sm font-medium">Точно?</span>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}

        {edit ? (
          <div className="mt-2 flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
            <input
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              placeholder="Имя"
              aria-label="Имя"
              autoFocus
              className={inputCls}
            />
            <input
              value={edit.position}
              onChange={(e) => setEdit({ ...edit, position: e.target.value })}
              placeholder="Должность (например: прораб, плиточник)"
              aria-label="Должность"
              className={inputCls}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="min-h-11 rounded-xl border border-input text-muted-foreground transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={commitEdit}
                disabled={!edit.name.trim()}
                className="min-h-11 rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {edit.id === null ? 'Добавить' : 'Сохранить'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={startAdd}
            className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-input text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            Новый человек
          </button>
        )}
      </div>
    </Modal>
  )
}
