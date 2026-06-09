import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/index'
import { useAppStore } from '../stores/appStore'
import { getBudgetSummary } from '../services/budget/calculator'
import { getRecordsByMonth } from '../services/record/recordService'
import { getToday, isCurrentMonth } from '../utils/date'
import type { Category, MonthlyBudget, CategoryBudget, RecordItem } from '../types'
import MonthPicker from '../components/common/MonthPicker'
import BudgetSummary from '../components/dashboard/BudgetSummary'
import BudgetAllocationHint from '../components/dashboard/BudgetAllocationHint'
import CategoryProgressList from '../components/dashboard/CategoryProgressList'
import EmptyState from '../components/common/EmptyState'

export default function DashboardPage() {
  const currentMonth = useAppStore((s) => s.currentMonth)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget | null>(null)
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [records, setRecords] = useState<RecordItem[]>([])

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
      setCategories(
        cats
          .filter((c) => c.budgetable && !c.archived)
          .sort((a, b) => a.order - b.order)
      )
      setRecords(recs)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  const today = getToday()
  const _isCurrentMonth = isCurrentMonth(currentMonth)

  const budgetData = monthlyBudget
    ? getBudgetSummary(monthlyBudget, categoryBudgets, records, categories, currentMonth, today)
    : null

  if (loading) {
    return (
      <div className="space-y-4">
        <MonthPicker />
        <div className="flex items-center justify-center py-20">
          <div className="space-y-3 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-400">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MonthPicker />

      {/* No budget set */}
      {!monthlyBudget && (
        <EmptyState
          icon={'\u{1F4B0}'}
          title="先设置本月预算"
          description="预算是预算控制的第一步"
          actionLabel="去设置预算"
          onAction={() => navigate('/budget')}
        />
      )}

      {/* Has budget */}
      {budgetData && (
        <>
          <BudgetSummary
            totalBudget={budgetData.summary!.totalBudget}
            totalExpense={budgetData.summary!.totalExpense}
            remaining={budgetData.summary!.remaining}
            isOverspent={budgetData.summary!.isOverspent}
            todaySuggested={budgetData.summary!.todaySuggested}
            monthlySurplus={budgetData.summary!.monthlySurplus}
            isCurrentMonth={_isCurrentMonth}
          />

          {/* Allocation hint */}
          {budgetData.allocationDiff &&
            budgetData.allocationDiff.type !== 'exact' && (
              <BudgetAllocationHint
                type={budgetData.allocationDiff.type}
                diff={budgetData.allocationDiff.diff}
              />
            )}

          {/* Category progress */}
          {budgetData.categoryStatuses.length > 0 && (
            <CategoryProgressList
              categoryStatuses={budgetData.categoryStatuses}
            />
          )}
        </>
      )}

      {/* Quick add button */}
      {monthlyBudget && (
        <button
          onClick={() => navigate('/add')}
          className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors shadow-sm"
        >
          记一笔
        </button>
      )}
    </div>
  )
}
