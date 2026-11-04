import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Trash2, Upload } from 'lucide-react'
import type { Category, Purchase } from '@/types'
import { exportCsv, exportJson, parseBackup } from '@/lib/export'
import Modal from '@/components/Modal'

interface SettingsMenuProps {
  open: boolean
  purchases: Purchase[]
  categories: Category[]
  onClose: () => void
  onImport: (data: { purchases: Purchase[]; categories: Category[] }) => void
  onClear: () => void
}

const rowCls =
  'flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-background px-4 text-left transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99]'

export default function SettingsMenu({
  open,
  purchases,
  categories,
  onClose,
  onImport,
  onClear,
}: SettingsMenuProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const data = parseBackup(await file.text())
      onImport(data)
      setMessage(`Импортировано покупок: ${data.purchases.length}`)
    } catch {
      setMessage('Не удалось прочитать файл — нужен бэкап, созданный этим приложением')
    }
  }

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    onClear()
    setConfirmClear(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Данные и настройки">
      <div className="flex flex-col gap-2 pb-2">
        <p className="mb-1 text-sm text-muted-foreground">
          Всё хранится только на этом устройстве, в браузере. Чтобы не потерять историю,
          периодически сохраняйте бэкап.
        </p>

        <button
          type="button"
          onClick={() => exportJson(purchases, categories)}
          disabled={purchases.length === 0}
          className={`${rowCls} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <Download className="h-5 w-5 shrink-0 text-deep" />
          <span className="flex-1">
            <span className="block font-medium">Бэкап (JSON)</span>
            <span className="block text-xs text-muted-foreground">
              Все покупки, категории и фото — для восстановления
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => exportCsv(purchases, categories)}
          disabled={purchases.length === 0}
          className={`${rowCls} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-deep" />
          <span className="flex-1">
            <span className="block font-medium">Таблица (CSV)</span>
            <span className="block text-xs text-muted-foreground">
              Для Excel и Google Таблиц, без фото
            </span>
          </span>
        </button>

        <button type="button" onClick={() => fileRef.current?.click()} className={rowCls}>
          <Upload className="h-5 w-5 shrink-0 text-deep" />
          <span className="flex-1">
            <span className="block font-medium">Восстановить из бэкапа</span>
            <span className="block text-xs text-muted-foreground">
              Записи добавятся к текущим, дубликаты пропускаются
            </span>
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            handleImport(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        {message && (
          <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
            {message}
          </p>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Опасная зона
          </p>
          <button
            type="button"
            onClick={handleClear}
            disabled={purchases.length === 0}
            className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 ${
              confirmClear
                ? 'border-destructive bg-destructive text-destructive-foreground'
                : 'border-destructive/40 bg-background text-destructive hover:bg-destructive/10'
            }`}
          >
            <Trash2 className="h-5 w-5 shrink-0" />
            <span className="flex-1">
              <span className="block font-medium">
                {confirmClear ? 'Нажмите ещё раз — всё будет удалено' : 'Очистить историю'}
              </span>
              <span className={`block text-xs ${confirmClear ? 'opacity-80' : 'text-muted-foreground'}`}>
                {confirmClear
                  ? `Покупок: ${purchases.length}. Отменить действие нельзя.`
                  : 'Удаляет все покупки и фото с этого устройства'}
              </span>
            </span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
