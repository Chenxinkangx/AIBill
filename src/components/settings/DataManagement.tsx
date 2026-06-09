import { useState, useRef } from 'react'
import { downloadBackup } from '../../services/backup/export'
import { importBackupFromFile } from '../../services/backup/import'
import { db } from '../../db/index'
import { initializeIfNeeded } from '../../db/seed'
import ConfirmDialog from '../common/ConfirmDialog'

export default function DataManagement() {
  const [importing, setImporting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message })
    setTimeout(() => setStatus(null), 3000)
  }

  const handleExport = async () => {
    try {
      await downloadBackup()
      showStatus('success', '已导出')
    } catch {
      showStatus('error', '导出失败')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    const result = await importBackupFromFile(file)
    setImporting(false)

    if (result.success) {
      showStatus('success', result.message)
    } else {
      showStatus('error', result.message)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
        db.settings.clear(),
      ])
      // Re-initialize with default categories
      await initializeIfNeeded()
      setClearing(false)
      showStatus('success', '数据已清空')
    } catch {
      showStatus('error', '清空失败')
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

      {/* Status toast */}
      {status && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 text-sm px-6 py-2.5 rounded-full shadow-lg ${
            status.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Clear confirm dialog */}
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
