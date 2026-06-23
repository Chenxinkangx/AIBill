import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { updateRecord, deleteRecord } from '@/services/record/recordService'
import type { RecordItem, BudgetCategory, Tag } from '@/types'
import TagSelector from '@/components/common/TagSelector'

interface Props {
  record: RecordItem
  categories: BudgetCategory[]
  tags: Tag[]
  onUpdated: () => void
  onDeleted: () => void
  showDeleteAction?: boolean
}

export default function RecordActions({
  record,
  categories,
  tags,
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
    budgetCategoryId: record.budgetCategoryId,
    tagIds: record.tagIds,
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
    const budgetCategoryId = form.type === 'income' ? 'income' : form.budgetCategoryId
    if (form.type === 'expense' && (!budgetCategoryId || budgetCategoryId === 'income')) {
      setError('请选择预算分类')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateRecord(record.id, {
        ...form,
        title: form.title.trim(),
        budgetCategoryId,
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
      <div className="bg-muted/50 rounded-xl p-4 mt-2 space-y-3 border border-border">
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="内容"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            placeholder="金额"
            className="[appearance:textfield]"
          />
          <NativeSelect
            value={form.type}
            onChange={(e) => {
              const type = e.target.value as RecordItem['type']
              const nextCategory =
                type === 'income'
                  ? 'income'
                  : categories.find((c) => c.budgetable && c.id !== 'income')?.id ?? ''
              setForm({ ...form, type, budgetCategoryId: nextCategory })
            }}
            options={[
              { value: 'expense', label: '支出' },
              { value: 'income', label: '收入' },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NativeSelect
            value={form.budgetCategoryId}
            onChange={(e) => setForm({ ...form, budgetCategoryId: e.target.value })}
            options={[
              ...categories
                .filter((c) =>
                  form.type === 'income'
                    ? c.id === 'income'
                    : (c.budgetable && !c.archived) || c.id === record.budgetCategoryId
                )
                .map((cat) => ({ value: cat.id, label: cat.name })),
            ]}
          />
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div>
          <p className="mb-2 text-xs text-muted-foreground">标签（可选，不扣预算）</p>
          <TagSelector
            tags={tags}
            compact
            selectedIds={form.tagIds}
            onChange={(tagIds) => setForm({ ...form, tagIds })}
          />
        </div>
        <Input
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="备注"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditing(false)}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-1 mt-2">
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          编辑
        </button>
        {showDeleteAction && (
          <button
            onClick={() => setDeleting(true)}
            className="px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
