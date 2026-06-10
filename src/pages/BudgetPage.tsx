import { useEffect, useState, useCallback } from 'react'
import { db } from '../db/index'
import { useAppStore } from '../stores/appStore'
import { getBudgetAllocationDiff, getCategoryBudgetStatuses } from '../services/budget/calculator'
import { getRecordsByMonth } from '../services/record/recordService'
import { getToday } from '../utils/date'
import { formatMoney, sumMoney } from '../utils/money'
import type { Category, MonthlyBudget, CategoryBudget, RecordItem } from '../types'
import MonthPicker from '../components/common/MonthPicker'
import TotalBudgetInput from '../components/budget/TotalBudgetInput'
import CategoryBudgetRow from '../components/budget/CategoryBudgetRow'
import { generateId } from '../utils/id'
import { createCategory, archiveCategory } from '../services/category/categoryService'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Toast from '../components/common/Toast'
import { useToast } from '../hooks/useToast'

export default function BudgetPage() {
  const currentMonth = useAppStore((s) => s.currentMonth)

  const [loading, setLoading] = useState(true)
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget | null>(null)
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [records, setRecords] = useState<RecordItem[]>([])
  const [saving, setSaving] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null)
  const { toast, showToast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [mb, cbs, cats, recs] = await Promise.all([
        db.monthlyBudgets.get({ month: currentMonth }),
        db.categoryBudgets.where({ month: currentMonth }).toArray(),
        db.categories.toArray(),
        getRecordsByMonth(currentMonth),
      ])
      setMonthlyBudget(mb ?? null)
      setCategoryBudgets(cbs)
      setCategories(cats.filter((c) => c.budgetable && !c.archived).sort((a, b) => a.order - b.order))
      setRecords(recs)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  const allocationDiff = monthlyBudget
    ? getBudgetAllocationDiff(monthlyBudget.totalBudget, categoryBudgets)
    : null

  const handleTotalBudgetChange = async (value: number) => {
    const nextValue = Math.max(0, value || 0)
    setSaving(true)
    const now = new Date().toISOString()
    if (monthlyBudget) {
      await db.monthlyBudgets.update(monthlyBudget.id, {
        totalBudget: nextValue,
        updatedAt: now,
      })
      setMonthlyBudget({ ...monthlyBudget, totalBudget: nextValue, updatedAt: now })
    } else {
      const newBudget: MonthlyBudget = {
        id: generateId(),
        month: currentMonth,
        totalBudget: nextValue,
        createdAt: now,
        updatedAt: now,
      }
      await db.monthlyBudgets.add(newBudget)
      setMonthlyBudget(newBudget)
    }
    setSaving(false)
  }

  const handleCategoryBudgetChange = async (categoryId: string, amount: number) => {
    const nextAmount = Math.max(0, amount || 0)
    const now = new Date().toISOString()
    const existing = categoryBudgets.find((cb) => cb.categoryId === categoryId)

    if (existing) {
      await db.categoryBudgets.update(existing.id, { amount: nextAmount, updatedAt: now })
      setCategoryBudgets((prev) =>
        prev.map((cb) => (cb.id === existing.id ? { ...cb, amount: nextAmount, updatedAt: now } : cb))
      )
    } else {
      const newCB: CategoryBudget = {
        id: generateId(),
        categoryId,
        month: currentMonth,
        amount: nextAmount,
        createdAt: now,
        updatedAt: now,
      }
      await db.categoryBudgets.add(newCB)
      setCategoryBudgets((prev) => [...prev, newCB])
    }
  }

  const handleCreateCategory = async () => {
    try {
      const category = await createCategory(newCategoryName)
      setCategories((prev) => [...prev, category].sort((a, b) => a.order - b.order))
      setNewCategoryName('')
      showToast('success', '分类已添加')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '添加分类失败')
    }
  }

  const handleArchiveCategory = async () => {
    if (!archiveTarget) return
    try {
      await archiveCategory(archiveTarget.id)
      setCategories((prev) => prev.filter((cat) => cat.id !== archiveTarget.id))
      setArchiveTarget(null)
      showToast('success', '分类已归档')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '归档失败')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <MonthPicker />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  const totalAllocated = categoryBudgets.reduce((sum, cb) => sum + cb.amount, 0)
  const totalIncome = sumMoney(records.filter((record) => record.type === 'income').map((record) => record.amount))
  const categoryStatuses = getCategoryBudgetStatuses(
    categories,
    categoryBudgets,
    records,
    currentMonth,
    getToday()
  )

  return (
    <div className="space-y-4">
      <MonthPicker />

      {/* Total Budget */}
      <TotalBudgetInput
        totalBudget={monthlyBudget?.totalBudget ?? 0}
        onChange={handleTotalBudgetChange}
      />

      {/* Allocation Diff */}
      {monthlyBudget && monthlyBudget.totalBudget > 0 && (
        <div className="bg-white rounded-xl px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">分类预算合计</span>
            <span className="font-medium">{formatMoney(totalAllocated)}</span>
          </div>
          {allocationDiff && (
            <div className="flex items-center justify-between text-sm mt-1">
              {allocationDiff.type === 'unallocated' && (
                <>
                  <span className="text-green-600">未分配预算</span>
                  <span className="text-green-600 font-medium">
                    +{formatMoney(allocationDiff.diff)}
                  </span>
                </>
              )}
              {allocationDiff.type === 'exact' && (
                <span className="text-gray-400 col-span-2">预算已全部分配</span>
              )}
              {allocationDiff.type === 'overspent' && (
                <>
                  <span className="text-red-500">已超出总预算</span>
                  <span className="text-red-500 font-medium">
                    -{formatMoney(allocationDiff.diff)}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-500">本月收入</span>
            <span className="text-green-600 font-medium">{formatMoney(totalIncome)}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!monthlyBudget && (
        <div className="text-center py-10 text-gray-400 space-y-2">
          <p>设置本月总预算后，即可分配分类预算</p>
        </div>
      )}

      {/* Category Budgets */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 px-1">分类预算</h2>
        {categories.map((cat) => {
          const cb = categoryBudgets.find((b) => b.categoryId === cat.id)
          const status = categoryStatuses.find((s) => s.categoryId === cat.id)
          const budget = cb?.amount ?? 0
          return (
            <CategoryBudgetRow
              key={cat.id}
              name={cat.name}
              icon={cat.icon}
              budget={budget}
              spent={status?.spent ?? 0}
              usageRate={status?.usageRate ?? 0}
              status={status?.status ?? 'normal'}
              onBudgetChange={(value) => handleCategoryBudgetChange(cat.id, value)}
              onArchive={() => setArchiveTarget(cat)}
            />
          )
        })}
        <div className="bg-white rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">添加分类</h3>
          <div className="flex gap-2">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="分类名称"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600"
            >
              添加
            </button>
          </div>
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full">
          保存中...
        </div>
      )}
      <ConfirmDialog
        open={archiveTarget !== null}
        title="归档分类"
        message="归档后不会在新账单中显示，历史账单仍会保留该分类名称。确定归档吗？"
        confirmLabel="归档"
        destructive
        onConfirm={handleArchiveCategory}
        onCancel={() => setArchiveTarget(null)}
      />
      <Toast toast={toast} />
    </div>
  )
}
