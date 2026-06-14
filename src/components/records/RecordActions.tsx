import { useState } from 'react'
import ConfirmDialog from '../common/ConfirmDialog'
import { updateRecord, deleteRecord } from '../../services/record/recordService'
import type { RecordItem, Category } from '../../types'

interface Props {
  record: RecordItem
  categories: Category[]
  onUpdated: () => void
  onDeleted: () => void
  showDeleteAction?: boolean
}

export default function RecordActions({
  record,
  categories,
  onUpdated,
  onDeleted,
  showDeleteAction = true,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: record.title,
    amount: record.amount,
    type: record.type,
    categoryId: record.categoryId,
    date: record.date,
    note: record.note ?? '',
  })
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('请填写账单内容')
      return
    }
    if (!form.amount || form.amount <= 0) {
      setError('请输入有效金额')
      return
    }
    if (!form.date) {
      setError('请选择日期')
      return
    }
    const categoryId = form.type === 'income' ? 'income' : form.categoryId
    if (form.type === 'expense' && (!categoryId || categoryId === 'income')) {
      setError('请选择支出分类')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateRecord(record.id, {
        ...form,
        title: form.title.trim(),
        categoryId,
      })
      setEditing(false)
      onUpdated()
    } catch {
      setError('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteRecord(record.id)
      setDeleting(false)
      onDeleted()
    } catch {
      setDeleting(false)
      setError('删除失败，请重试')
    }
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
            value={form.type}
            onChange={(e) => {
              const type = e.target.value as RecordItem['type']
              const nextCategory =
                type === 'income'
                  ? 'income'
                  : categories.find((c) => c.budgetable && c.id !== 'income')?.id ?? ''
              setForm({ ...form, type, categoryId: nextCategory })
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-white"
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-white"
          >
            {categories
              .filter((c) =>
                form.type === 'income'
                  ? c.id === 'income'
                  : (c.budgetable && !c.archived) || c.id === record.categoryId
              )
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <input
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="备注"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
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
      <div className="flex gap-1 mt-2">
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          编辑
        </button>
        {showDeleteAction && (
          <button
            onClick={() => setDeleting(true)}
            className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            删除
          </button>
        )}
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
