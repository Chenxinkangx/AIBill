import { useState, useEffect, useCallback } from 'react'
import { db } from '../db/index'
import { useRecordStore } from '../stores/recordStore'
import { createRecord } from '../services/record/recordService'
import { parseNaturalLanguageRecord } from '../services/ai/parseRecord'
import { getToday } from '../utils/date'
import type { Category, ParsedRecordItem } from '../types'
import ManualForm from '../components/record/ManualForm'
import AiInputBox from '../components/record/AiInputBox'
import AiParseResultList from '../components/record/AiParseResultList'
import type { ManualRecordFormValues } from '../services/record/validation'

export default function AddRecordPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const loadRecords = useRecordStore((s) => s.loadRecordsByMonth)

  // AI mode state
  const [aiInput, setAiInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsedItems, setParsedItems] = useState<ParsedRecordItem[]>([])
  const [aiError, setAiError] = useState<string | null>(null)

  // Tab state
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')

  useEffect(() => {
    db.categories
      .filter((c) => (c.budgetable || c.id === 'income') && !c.archived)
      .toArray()
      .then(setCategories)
  }, [])

  const handleParse = async () => {
    if (!aiInput.trim()) return

    setParsing(true)
    setAiError(null)
    setParsedItems([])

    const result = await parseNaturalLanguageRecord(aiInput, categories, getToday())

    if (result.error) {
      setAiError(result.error)
    } else {
      setParsedItems(result.items)
    }
    setParsing(false)
  }

  const handleRemoveParsedItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateParsedItem = (index: number, field: keyof ParsedRecordItem, value: string | number) => {
    setParsedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const handleConfirmAi = async () => {
    if (parsedItems.length === 0) return

    setSaving(true)
    setSuccess(false)

    try {
      const now = new Date().toISOString()
      const records = parsedItems.map((item) => ({
        id: crypto.randomUUID(),
        title: item.title,
        amount: item.amount,
        categoryId: item.categoryId ?? 'cat-other',
        type: item.type,
        date: item.date,
        source: 'ai' as const,
        createdAt: now,
        updatedAt: now,
      }))

      await db.records.bulkAdd(records)

      setSuccessMsg(`已保存 ${records.length} 条账单`)
      setSuccess(true)
      setParsedItems([])
      setAiInput('')

      // Refresh store
      const month = getToday().slice(0, 7)
      loadRecords(month)

      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleManualSave = useCallback(
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
        setSuccessMsg('已保存')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
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
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-800">记账</h1>

      {/* Mode switch */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setMode('ai')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === 'ai'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          AI 智能记账
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === 'manual'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          手动记账
        </button>
      </div>

      {/* AI mode */}
      {mode === 'ai' && (
        <div className="space-y-4">
          <AiInputBox
            value={aiInput}
            onChange={setAiInput}
            onParse={handleParse}
            parsing={parsing}
          />

          {/* AI Error */}
          {aiError && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              {aiError}
              {aiError.includes('API Key') && (
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="ml-2 underline"
                >
                  去设置
                </button>
              )}
            </div>
          )}

          <AiParseResultList
            items={parsedItems}
            categories={categories}
            onUpdate={handleUpdateParsedItem}
            onRemove={handleRemoveParsedItem}
            onConfirm={handleConfirmAi}
            saving={saving}
          />
        </div>
      )}

      {/* Manual mode */}
      {mode === 'manual' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">逐条记录每一笔消费</p>
          <ManualForm categories={categories} onSave={handleManualSave} saving={saving} />
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm px-6 py-2.5 rounded-full shadow-lg z-50">
          {successMsg}
        </div>
      )}
    </div>
  )
}
