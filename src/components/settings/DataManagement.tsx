import { useState, useRef } from 'react'
import { downloadBackup } from '../../services/backup/export'
import { importBackupFromFile } from '../../services/backup/import'
import { db } from '../../db/index'
import { initializeIfNeeded } from '../../db/seed'
import ConfirmDialog from '../common/ConfirmDialog'
import { useSettingsStore } from '../../stores/settingsStore'
import Toast from '../common/Toast'
import { useToast } from '../../hooks/useToast'

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
      <h2 className="text-sm font-medium text-gray-500">数据管理</h2>

      <button
        onClick={handleExport}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>导出 JSON 备份</span>
        <span className="text-gray-400">📥</span>
      </button>

      <label className="block">
        <div className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
          <span>{importing ? '导入中...' : '导入 JSON 恢复'}</span>
          <span className="text-gray-400">📤</span>
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
        onClick={() => setClearing(true)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
      >
        <span>清空所有数据</span>
        <span>🗑️</span>
      </button>

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
