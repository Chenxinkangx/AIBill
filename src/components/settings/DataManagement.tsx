import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

      <Card
        onClick={handleExport}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-foreground cursor-pointer hover:bg-muted/80 transition-colors"
      >
        <span>导出 JSON 备份</span>
        <span className="text-muted-foreground">📥</span>
      </Card>

      <label className="block">
        <Card className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-foreground cursor-pointer hover:bg-muted/80 transition-colors">
          <span>{importing ? '导入中...' : '导入 JSON 恢复'}</span>
          <span className="text-muted-foreground">📤</span>
        </Card>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          disabled={importing}
        />
      </label>

      <Button
        variant="destructive"
        onClick={() => setClearing(true)}
        className="w-full flex items-center justify-between"
      >
        <span>清空所有数据</span>
        <span>🗑️</span>
      </Button>

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
