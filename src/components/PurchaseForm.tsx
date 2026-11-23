import { useRef, useState } from 'react'
import { Check, Globe, HelpCircle, ImagePlus, Plus, Store, X } from 'lucide-react'
import type { Category, Purchase, Source } from '@/types'
import { SOURCE_LABELS } from '@/types'
import { fileToCompressedDataUrl } from '@/lib/photo'
import { toInputDateTime } from '@/lib/format'
import { CATEGORY_PALETTE } from '@/lib/palette'
import Modal from '@/components/Modal'

export interface PurchaseDraft {
  name: string
  amount: number
  categoryId: string | null
  date: string
  source: Source
  note: string
  photo?: string
}

interface PurchaseFormProps {
  open: boolean
  initial: Purchase | null
  categories: Category[]
  onClose: () => void
  onSubmit: (draft: PurchaseDraft) => void
  onCreateCategory: (category: Category) => void
}

const SOURCE_ICONS: Record<Source, typeof Store> = {
  offline: Store,
  online: Globe,
  unknown: HelpCircle,
}
const SOURCE_ORDER: Source[] = ['unknown', 'offline', 'online']

const inputCls =
  'w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus-visible:outline-none'

export default function PurchaseForm({
  open,
  initial,
  categories,
  onClose,
  onSubmit,
  onCreateCategory,
}: PurchaseFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amountStr, setAmountStr] = useState(initial ? String(initial.amount) : '')
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null)
  const [dateTime, setDateTime] = useState(
    initial ? toInputDateTime(initial.date) : toInputDateTime(new Date().toISOString()),
  )
  const [source, setSource] = useState<Source>(initial?.source ?? 'unknown')
  const [note, setNote] = useState(initial?.note ?? '')
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo)
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({})
  const [catFormOpen, setCatFormOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(CATEGORY_PALETTE[3])
  const fileRef = useRef<HTMLInputElement>(null)

  const createCategory = () => {
    const trimmed = newCatName.trim()
    if (!trimmed) return
    const cat: Category = {
      id: `cat-${Date.now().toString(36)}`,
      name: trimmed,
      color: newCatColor,
    }
    onCreateCategory(cat)
    setCategoryId(cat.id)
    setCatFormOpen(false)
    setNewCatName('')
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setPhoto(await fileToCompressedDataUrl(file))
    } catch {
      setPhoto(undefined)
    }
  }

  const submit = () => {
    const next: typeof errors = {}
    const amount = Number(amountStr.replace(',', '.'))
    if (!name.trim()) next.name = 'Укажите название'
    if (!amountStr.trim() || Number.isNaN(amount) || amount <= 0)
      next.amount = 'Укажите сумму больше нуля'
    setErrors(next)
    if (next.name || next.amount) return
    onSubmit({
      name: name.trim(),
      amount,
      categoryId,
      date: new Date(dateTime).toISOString(),
      source,
      note: note.trim(),
      photo,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Редактировать покупку' : 'Новая покупка'}
    >
      <form
        className="flex flex-col gap-4 pb-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div>
          {photo ? (
            <div className="relative">
              <img
                src={photo}
                alt="Фото покупки"
                className="max-h-52 w-full rounded-xl border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => setPhoto(undefined)}
                aria-label="Убрать фото"
                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white transition-transform hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-24 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99]"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-sm">Добавить фото</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-name" className="text-sm text-muted-foreground">
            Название
          </label>
          <input
            id="pf-name"
            className={inputCls}
            placeholder="Например: краска, свёрла, герметик"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
            }}
            autoFocus={!initial}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-amount" className="text-sm text-muted-foreground">
            Сумма, ₽
          </label>
          <input
            id="pf-amount"
            className={inputCls}
            placeholder="0"
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => {
              setAmountStr(e.target.value.replace(/[^\d.,]/g, ''))
              if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }))
            }}
          />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Категория</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95 ${
                categoryId === null
                  ? 'border-foreground bg-secondary font-medium'
                  : 'border-input text-muted-foreground hover:border-ring'
              }`}
            >
              Без категории
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95 ${
                  categoryId === c.id
                    ? 'border-foreground bg-secondary font-medium'
                    : 'border-input text-muted-foreground hover:border-ring'
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCatFormOpen((v) => !v)}
              aria-label="Создать категорию"
              className="flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-input px-4 text-sm text-muted-foreground transition-all hover:border-ring hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Своя
            </button>
          </div>
          {catFormOpen && (
            <div className="mt-1 flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Название новой категории"
                aria-label="Название новой категории"
                className={inputCls}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    createCategory()
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCatColor(color)}
                    aria-label={`Цвет ${color}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95"
                    style={{ backgroundColor: color }}
                  >
                    {newCatColor === color && (
                      <Check className="h-4 w-4 text-black/70" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={createCategory}
                disabled={!newCatName.trim()}
                className="min-h-11 rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Создать и выбрать
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-date" className="text-sm text-muted-foreground">
            Дата и время покупки
          </label>
          <input
            id="pf-date"
            type="datetime-local"
            className={inputCls}
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Источник траты</span>
          <div className="grid grid-cols-3 gap-2">
            {SOURCE_ORDER.map((s) => {
              const Icon = SOURCE_ICONS[s]
              const active = source === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-95 ${
                    active
                      ? 'border-primary bg-primary/15 font-medium text-deep'
                      : 'border-input text-muted-foreground hover:border-ring'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {SOURCE_LABELS[s]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-note" className="text-sm text-muted-foreground">
            Заметка
          </label>
          <textarea
            id="pf-note"
            className={`${inputCls} min-h-20 resize-y`}
            placeholder="Магазин, артикул, детали…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="mt-1 min-h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition-transform hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98]"
        >
          {initial ? 'Сохранить' : 'Добавить покупку'}
        </button>
      </form>
    </Modal>
  )
}
