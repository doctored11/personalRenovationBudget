import { useState } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Category } from '@/types'
import Modal from '@/components/Modal'
import { CATEGORY_PALETTE as PALETTE } from '@/lib/palette'

interface CategoryManagerProps {
  open: boolean
  categories: Category[]
  onClose: () => void
  onSave: (categories: Category[]) => void
}

interface EditState {
  id: string | null
  name: string
  color: string
}

export default function CategoryManager({
  open,
  categories,
  onClose,
  onSave,
}: CategoryManagerProps) {
  const [edit, setEdit] = useState<EditState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const startAdd = () => setEdit({ id: null, name: '', color: PALETTE[0] })
  const startEdit = (c: Category) => setEdit({ id: c.id, name: c.name, color: c.color })

  const commitEdit = () => {
    if (!edit || !edit.name.trim()) return
    if (edit.id === null) {
      onSave([
        ...categories,
        { id: `cat-${Date.now().toString(36)}`, name: edit.name.trim(), color: edit.color },
      ])
    } else {
      onSave(
        categories.map((c) =>
          c.id === edit.id ? { ...c, name: edit.name.trim(), color: edit.color } : c,
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
    onSave(categories.filter((c) => c.id !== id))
    setDeletingId(null)
  }

  return (
    <Modal open={open} onClose={onClose} title="Категории">
      <div className="flex flex-col gap-2 pb-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-background px-4"
          >
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            <span className="min-w-0 flex-1 truncate">{c.name}</span>
            <button
              type="button"
              onClick={() => startEdit(c)}
              aria-label={`Изменить категорию ${c.name}`}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => remove(c.id)}
              aria-label={`Удалить категорию ${c.name}`}
              className={`flex h-11 items-center justify-center rounded-full px-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95 ${
                deletingId === c.id
                  ? 'bg-destructive text-destructive-foreground'
                  : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
              }`}
            >
              {deletingId === c.id ? (
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
              placeholder="Название категории"
              aria-label="Название категории"
              autoFocus
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none placeholder:text-muted-foreground/60 focus:border-ring"
            />
            <div className="flex flex-wrap items-center gap-2">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEdit({ ...edit, color })}
                  aria-label={`Цвет ${color}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
                  style={{ backgroundColor: color }}
                >
                  {edit.color === color && (
                    <Check className="h-5 w-5 text-black/70" strokeWidth={3} />
                  )}
                </button>
              ))}
              <label
                className="flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-input focus-within:outline focus-within:outline-2 focus-within:outline-ring"
                title="Свой цвет"
              >
                <input
                  type="color"
                  value={edit.color}
                  onChange={(e) => setEdit({ ...edit, color: e.target.value })}
                  className="h-14 w-14 cursor-pointer border-0 bg-transparent p-0"
                  aria-label="Выбрать свой цвет"
                />
              </label>
            </div>
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
            Новая категория
          </button>
        )}
      </div>
    </Modal>
  )
}
