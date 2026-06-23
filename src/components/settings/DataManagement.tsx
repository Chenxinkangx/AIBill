import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Upload, Trash2, ChevronRight } from 'lucide-react'
import { downloadBackup } from '@/services/backup/export'
import { importBackupFromFile } from '@/services/backup/import'
import { db } from '@/db/index'
import { initializeIfNeeded } from '@/db/seed'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useSettingsStore } from '@/stores/settingsStore'
import Toast from '@/components/common/Toast'
import { useToast } from '@/hooks/useToast'

export default function DataManagement() {
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const [importing, setImporting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [confirmingImport, setConfirmingImport] = useState(false)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast, showToast } = useToast()

  const handleExport = async () => {
    try {
      await downloadBackup()
      showToast('success', '已导出')
    } catch {
      showToast('error', '导出失败')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPendingImportFile(file)
    setConfirmingImport(true)
  }

  const resetImportInput = () => {
    setPendingImportFile(null)
    setConfirmingImport(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConfirmImport = async () => {
    if (importing) return
    if (!pendingImportFile) return

    setImporting(true)
    const result = await importBackupFromFile(pendingImportFile)
    setImporting(false)
    resetImportInput()

    if (result.success) {
      await loadSettings()
      showToast('success', result.message)
    } else {
      showToast('error', result.message)
    }

  }

  const handleClear = async () => {
    try {
      // Clear all tables
      await Promise.all([
        db.categories.clear(),
        db.monthlyBudgets.clear(),
        db.categoryBudgets.clear(),
        db.records.clear(),
        db.tags.clear(),
        db.settings.clear(),
      ])
      // Re-initialize with default categories
      await initializeIfNeeded()
      await loadSettings()
      setClearing(false)
      showToast('success', '数据已清空')
    } catch {
      showToast('error', '清空失败')
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">数据管理</h2>

      <Card className="rounded-xl divide-y divide-border">
        <button
          type="button"
          onClick={handleExport}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Download className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">导出 JSON 备份</p>
              <p className="text-xs text-muted-foreground">保存全部数据到文件</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>

        <label className="block">
          <div className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{importing ? '导入中...' : '导入 JSON 恢复'}</p>
                <p className="text-xs text-muted-foreground">从备份文件恢复数据</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            disabled={importing}
          />
        </label>

        <button
          type="button"
          onClick={() => setClearing(true)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
              <Trash2 className="size-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">清空所有数据</p>
              <p className="text-xs text-muted-foreground">清除全部账单和设置</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </Card>

      <Toast toast={toast} />

      {/* Clear confirm dialog */}
      <ConfirmDialog
        open={confirmingImport}
        title="导入 JSON 恢复"
        message="导入会覆盖当前本地数据，建议先导出备份。确定继续吗？"
        confirmLabel={importing ? '导入中...' : '继续导入'}
        onConfirm={handleConfirmImport}
        onCancel={resetImportInput}
      />

      <ConfirmDialog
        open={clearing}
        title="清空所有数据"
        message="确定清空所有数据吗？该操作不可恢复。建议先导出备份。"
        confirmLabel="清空"
        destructive
        onConfirm={handleClear}
        onCancel={() => setClearing(false)}
      />
    </div>
  )
}
