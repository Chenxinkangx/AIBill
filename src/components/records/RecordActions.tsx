import { useState } from 'react'
import ConfirmDialog from '../common/ConfirmDialog'
import { updateRecord, deleteRecord } from '../../services/record/recordService'
import type { RecordItem, Category } from '../../types'

interface Props {
  record: RecordItem
  categories: Category[]
  onUpdated: () => void
  onDeleted: () => void
}

export default function RecordActions({ record, categories, onUpdated, onDeleted }: Props) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: record.title,
    amount: record.amount,
    categoryId: record.categoryId,
    note: record.note ?? '',
  })

  const handleSave = async () => {
    if (!form.title || !form.amount || form.amount <= 0) return
    setSaving(true)
    await updateRecord(record.id, form)
    setSaving(false)
    setEditing(false)
    onUpdated()
  }

  const handleDelete = async () => {
    await deleteRecord(record.id)
    setDeleting(false)
    onDeleted()
  }

  if (editing) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 mt-2 space-y-3 border border-gray-100">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="内容"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            placeholder="金额"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400 [appearance:textfield]"
          />
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-white"
          >
            {categories
              .filter((c) => c.budgetable || c.id === record.categoryId || c.id === 'income')
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>
        <input
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="备注"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-sm disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-1 mt-1">
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-1 text-xs text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          编辑
        </button>
        <button
          onClick={() => setDeleting(true)}
          className="px-3 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          删除
        </button>
      </div>

      <ConfirmDialog
        open={deleting}
        title="删除账单"
        message="确定删除这条账单吗？删除后预算会自动重新计算。"
        confirmLabel="删除"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleting(false)}
      />
    </>
  )
}
