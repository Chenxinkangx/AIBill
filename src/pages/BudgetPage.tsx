import { useEffect, useState, useCallback } from 'react'
import { db } from '../db/index'
import { useAppStore } from '../stores/appStore'
import { getBudgetAllocationDiff } from '../services/budget/calculator'
import { formatMoney } from '../utils/money'
import type { Category, MonthlyBudget, CategoryBudget } from '../types'
import MonthPicker from '../components/common/MonthPicker'
import TotalBudgetInput from '../components/budget/TotalBudgetInput'
import CategoryBudgetRow from '../components/budget/CategoryBudgetRow'
import { generateId } from '../utils/id'

export default function BudgetPage() {
  const currentMonth = useAppStore((s) => s.currentMonth)

  const [loading, setLoading] = useState(true)
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget | null>(null)
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [mb, cbs, cats] = await Promise.all([
        db.monthlyBudgets.get({ month: currentMonth }),
        db.categoryBudgets.where({ month: currentMonth }).toArray(),
        db.categories.toArray(),
      ])
      setMonthlyBudget(mb ?? null)
      setCategoryBudgets(cbs)
      setCategories(cats.filter((c) => c.budgetable && !c.archived).sort((a, b) => a.order - b.order))
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
    setSaving(true)
    const now = new Date().toISOString()
    if (monthlyBudget) {
      await db.monthlyBudgets.update(monthlyBudget.id, {
        totalBudget: value,
        updatedAt: now,
      })
      setMonthlyBudget({ ...monthlyBudget, totalBudget: value, updatedAt: now })
    } else {
      const newBudget: MonthlyBudget = {
        id: generateId(),
        month: currentMonth,
        totalBudget: value,
        createdAt: now,
        updatedAt: now,
      }
      await db.monthlyBudgets.add(newBudget)
      setMonthlyBudget(newBudget)
    }
    setSaving(false)
  }

  const handleCategoryBudgetChange = async (categoryId: string, amount: number) => {
    const now = new Date().toISOString()
    const existing = categoryBudgets.find((cb) => cb.categoryId === categoryId)

    if (existing) {
      await db.categoryBudgets.update(existing.id, { amount, updatedAt: now })
      setCategoryBudgets((prev) =>
        prev.map((cb) => (cb.id === existing.id ? { ...cb, amount, updatedAt: now } : cb))
      )
    } else {
      const newCB: CategoryBudget = {
        id: generateId(),
        categoryId,
        month: currentMonth,
        amount,
        createdAt: now,
        updatedAt: now,
      }
      await db.categoryBudgets.add(newCB)
      setCategoryBudgets((prev) => [...prev, newCB])
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
        </div>
      )}

      {/* Empty State */}
      {!monthlyBudget && (
        <div className="text-center py-10 text-gray-400 space-y-2">
          <p>设置本月总预算后，即可分配分类预算</p>
        </div>
      )}

      {/* Category Budgets */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 px-1">分类预算</h2>
          {categories.map((cat) => {
            const cb = categoryBudgets.find((b) => b.categoryId === cat.id)
            const budget = cb?.amount ?? 0
            return (
              <CategoryBudgetRow
                key={cat.id}
                name={cat.name}
                icon={cat.icon}
                budget={budget}
                spent={0}
                usageRate={0}
                status="normal"
                onBudgetChange={(value) => handleCategoryBudgetChange(cat.id, value)}
              />
            )
          })}
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full">
          保存中...
        </div>
      )}
    </div>
  )
}
