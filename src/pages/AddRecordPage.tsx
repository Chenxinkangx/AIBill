import { useState, useEffect, useCallback } from 'react'
import { db } from '../db/index'
import { useRecordStore } from '../stores/recordStore'
import { createRecord } from '../services/record/recordService'
import { parseNaturalLanguageRecord } from '../services/ai/parseRecord'
import { getToday } from '../utils/date'
import type { Category, ParsedRecordItem } from '../types'
import ManualForm from '../components/record/ManualForm'
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
          <div className="bg-white rounded-xl p-4 space-y-3">
            <label className="text-sm font-medium text-gray-600">
              输入消费记录
            </label>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="例如：今天午饭18，地铁4，买书36，电影45"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 transition-colors resize-none placeholder:text-gray-300"
            />
            <button
              onClick={handleParse}
              disabled={parsing || !aiInput.trim()}
              className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {parsing ? 'AI 解析中...' : '智能识别'}
            </button>
          </div>

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

          {/* Parsed results */}
          {parsedItems.length > 0 && (
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-50">
                <p className="text-sm font-medium text-gray-700">
                  识别结果（{parsedItems.length} 条）
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {parsedItems.map((item, index) => (
                  <div key={index} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Low confidence warning */}
                        {item.confidence < 0.7 && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded shrink-0">
                            请确认
                          </span>
                        )}
                        <input
                          value={item.title}
                          onChange={(e) =>
                            handleUpdateParsedItem(index, 'title', e.target.value)
                          }
                          className="text-sm font-medium text-gray-800 outline-none bg-transparent flex-1 min-w-0"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveParsedItem(index)}
                        className="text-red-400 hover:text-red-600 text-xs shrink-0 ml-2"
                      >
                        删除
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {/* Amount */}
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          handleUpdateParsedItem(index, 'amount', Number(e.target.value))
                        }
                        className="w-20 px-2 py-1 bg-gray-50 rounded-lg text-gray-700 text-sm outline-none [appearance:textfield]"
                      />
                      <span className="text-gray-300">|</span>
                      {/* Category select */}
                      <select
                        value={item.categoryId ?? ''}
                        onChange={(e) => {
                          const cat = categories.find((c) => c.id === e.target.value)
                          handleUpdateParsedItem(index, 'categoryId', e.target.value)
                          handleUpdateParsedItem(index, 'categoryName', cat?.name ?? '')
                        }}
                        className="text-sm text-gray-600 outline-none bg-transparent"
                      >
                        {categories
                          .filter((c) => c.budgetable || c.id === 'income')
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                      <span className="text-gray-300">|</span>
                      {/* Date */}
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) =>
                          handleUpdateParsedItem(index, 'date', e.target.value)
                        }
                        className="text-xs text-gray-500 outline-none bg-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirm button */}
              <div className="px-4 py-3 border-t border-gray-50">
                <button
                  onClick={handleConfirmAi}
                  disabled={saving || parsedItems.length === 0}
                  className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '保存中...' : `确认保存（${parsedItems.length} 条）`}
                </button>
              </div>
            </div>
          )}
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
