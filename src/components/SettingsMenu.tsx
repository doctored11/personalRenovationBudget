import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Trash2, Upload } from 'lucide-react'
import { exportCsv, exportJson, exportTimeCsv, parseBackup, type BackupData } from '@/lib/export'
import {
  loadCategories,
  loadPurchases,
  loadWorkEntries,
  loadWorkers,
  loadWorkTypes,
} from '@/lib/storage'
import Modal from '@/components/Modal'

interface SettingsMenuProps {
  open: boolean
  mode: 'money' | 'time'
  onClose: () => void
  onImport: (data: BackupData) => void
  onClear: () => void
}

const rowCls =
  'flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-background px-4 text-left transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99]'

export default function SettingsMenu({ open, mode, onClose, onImport, onClear }: SettingsMenuProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleExportJson = () => {
    exportJson(loadPurchases(), loadCategories(), loadWorkers(), loadWorkTypes(), loadWorkEntries())
  }

  const handleExportCsv = () => {
    if (mode === 'money') {
      exportCsv(loadPurchases(), loadCategories())
    } else {
      exportTimeCsv(loadWorkEntries(), loadWorkers(), loadWorkTypes())
    }
  }

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const data = parseBackup(await file.text())
      onImport(data)
      const parts = []
      if (data.purchases.length > 0) parts.push(`покупок: ${data.purchases.length}`)
      if (data.workEntries.length > 0) parts.push(`записей времени: ${data.workEntries.length}`)
      setMessage(`Импортировано ${parts.length > 0 ? parts.join(', ') : '0 записей'}`)
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

  const isEmpty = mode === 'money' ? loadPurchases().length === 0 : loadWorkEntries().length === 0
  const clearCount = mode === 'money' ? loadPurchases().length : loadWorkEntries().length
  const clearWhat = mode === 'money' ? 'покупки и фото' : 'записи времени'
  const clearLabel = mode === 'money' ? `Покупок: ${clearCount}` : `Записей: ${clearCount}`

  return (
    <Modal open={open} onClose={onClose} title="Данные и настройки">
      <div className="flex flex-col gap-2 pb-2">
        <p className="mb-1 text-sm text-muted-foreground">
          Всё хранится только на этом устройстве, в браузере. Чтобы не потерять историю,
          периодически сохраняйте бэкап.
        </p>

        <button
          type="button"
          onClick={handleExportJson}
          className={rowCls}
        >
          <Download className="h-5 w-5 shrink-0 text-deep" />
          <span className="flex-1">
            <span className="block font-medium">Бэкап (JSON)</span>
            <span className="block text-xs text-muted-foreground">
              Покупки, записи времени, категории и фото — для восстановления
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isEmpty}
          className={`${rowCls} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-deep" />
          <span className="flex-1">
            <span className="block font-medium">
              Таблица (CSV) — {mode === 'money' ? 'расходы' : 'время'}
            </span>
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
            disabled={isEmpty}
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
                  ? `${clearLabel}. Отменить действие нельзя.`
                  : `Удаляет все ${clearWhat} с этого устройства`}
              </span>
            </span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
