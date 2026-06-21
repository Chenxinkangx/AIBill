import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/index'
import { useRecordStore } from '../stores/recordStore'
import { useAppStore } from '../stores/appStore'
import { createRecord, createRecordsFromParsed } from '../services/record/recordService'
import { parseNaturalLanguageRecord } from '../services/ai/parseRecord'
import { getToday } from '../utils/date'
import type { BudgetCategory, MonthlyBudget, ParsedRecordItem, Tag } from '../types'
import ManualForm from '../components/record/ManualForm'
import AiInputBox from '../components/record/AiInputBox'
import AiParseResultList from '../components/record/AiParseResultList'
import type { ManualRecordFormValues } from '../services/record/validation'
import EmptyState from '../components/common/EmptyState'
import Toast from '../components/common/Toast'
import { useToast } from '../hooks/useToast'

export default function AddRecordPage() {
  const navigate = useNavigate()
  const currentMonth = useAppStore((s) => s.currentMonth)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const loadRecords = useRecordStore((s) => s.loadRecordsByMonth)
  const { toast, showToast } = useToast()

  // AI mode state
  const [aiInput, setAiInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsedItems, setParsedItems] = useState<ParsedRecordItem[]>([])
  const [aiError, setAiError] = useState<string | null>(null)

  // Tab state
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      db.categories
        .filter((c) => (c.budgetable || c.id === 'income') && !c.archived)
        .toArray(),
      db.monthlyBudgets.get({ month: currentMonth }),
      db.tags.filter((tag) => !tag.archived).toArray(),
    ])
      .then(([cats, budget, loadedTags]) => {
        setCategories(cats)
        setMonthlyBudget(budget ?? null)
        setTags(loadedTags)
      })
      .finally(() => setLoading(false))
  }, [currentMonth])

  const handleParse = async () => {
    if (!aiInput.trim()) return

    setParsing(true)
    setAiError(null)
    setParsedItems([])

    const result = await parseNaturalLanguageRecord(aiInput, categories, getToday(), tags)

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

  const handleUpdateParsedItem = (index: number, field: keyof ParsedRecordItem, value: string | number | string[]) => {
    setParsedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const handleConfirmAi = async () => {
    if (parsedItems.length === 0) return
    const hasInvalidItem = parsedItems.some(
      (item) =>
        !item.title.trim() ||
        !item.amount ||
        item.amount <= 0 ||
        !item.date ||
        (item.type === 'expense' && (!item.budgetCategoryId || item.budgetCategoryId === 'income'))
    )
    if (hasInvalidItem) {
      showToast('error', '请检查识别结果中的金额、分类和日期')
      return
    }

    setSaving(true)

    try {
      const records = await createRecordsFromParsed(parsedItems)
      showToast('success', `已保存 ${records.length} 条账单`)
      setParsedItems([])
      setAiInput('')

      loadRecords(currentMonth)
    } catch {
      showToast('error', '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleManualSave = useCallback(
    async (data: ManualRecordFormValues) => {
      setSaving(true)
      try {
        await createRecord({
          title: data.title,
          amount: data.amount,
          budgetCategoryId: data.type === 'income' ? 'income' : data.budgetCategoryId,
          tagIds: data.tagIds,
          type: data.type,
          date: data.date,
          note: data.note || undefined,
          source: 'manual',
        })
        showToast('success', '已保存')
        const month = data.date.slice(0, 7)
        loadRecords(month)
      } catch {
        showToast('error', '保存失败，请重试')
      } finally {
        setSaving(false)
      }
    },
    [loadRecords, showToast]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">加载中...</p>
      </div>
    )
  }

  if (!monthlyBudget) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-800">记账</h1>
        <EmptyState
          icon={'\u{1F4B0}'}
          title="请先设置本月预算"
          description="预算设置完成后再记账，才能看到准确的剩余金额"
          actionLabel="去设置预算"
          onAction={() => navigate('/budget')}
        />
      </div>
    )
  }

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
            autoFocus={mode === 'ai'}
          />

          {/* AI Error */}
          {aiError && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              {aiError}
              {aiError.includes('API Key') && (
                <button
                  onClick={() => navigate('/settings')}
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
            tags={tags}
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
          <ManualForm categories={categories} tags={tags} onSave={handleManualSave} saving={saving} />
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
