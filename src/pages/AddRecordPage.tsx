import { useState, useEffect, useCallback } from 'react'
import { db } from '../db/index'
import { useRecordStore } from '../stores/recordStore'
import { createRecord } from '../services/record/recordService'
import type { Category } from '../types'
import ManualForm from '../components/record/ManualForm'
import type { ManualRecordFormValues } from '../services/record/validation'

export default function AddRecordPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const loadRecords = useRecordStore((s) => s.loadRecordsByMonth)

  useEffect(() => {
    db.categories
      .filter((c) => (c.budgetable || c.id === 'income') && !c.archived)
      .toArray()
      .then(setCategories)
  }, [])

  const handleSave = useCallback(
    async (data: ManualRecordFormValues) => {
      setSaving(true)
      setSuccess(false)
      try {
        await createRecord({
          title: data.title,
          amount: data.amount,
          categoryId: data.categoryId,
          type: data.type,
          date: data.date,
          note: data.note || undefined,
          source: 'manual',
        })
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
        // Refresh store
        const month = data.date.slice(0, 7)
        loadRecords(month)
      } finally {
        setSaving(false)
      }
    },
    [loadRecords]
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">手动记账</h1>
      <p className="text-sm text-gray-400">逐条记录每一笔消费</p>

      <ManualForm categories={categories} onSave={handleSave} saving={saving} />

      {success && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm px-6 py-2.5 rounded-full shadow-lg animate-bounce">
          已保存
        </div>
      )}
    </div>
  )
}
