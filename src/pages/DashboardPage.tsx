import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/db/index'
import { useAppStore } from '@/stores/appStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getBudgetStatus, getBudgetSummary } from '@/services/budget/calculator'
import { getRecordsByMonth } from '@/services/record/recordService'
import { getMonthProgress, getToday, isCurrentMonth } from '@/utils/date'
import type { BudgetCategory, MonthlyBudget, CategoryBudget, RecordItem } from '@/types'
import { generateId } from '@/utils/id'
import { sumMoney } from '@/utils/money'
import MonthPicker from '@/components/common/MonthPicker'
import BudgetSummary from '@/components/dashboard/BudgetSummary'
import BudgetAllocationHint from '@/components/dashboard/BudgetAllocationHint'
import CategoryProgressList from '@/components/dashboard/CategoryProgressList'
import EmptyState from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const currentMonth = useAppStore((s) => s.currentMonth)
  const settings = useSettingsStore((s) => s.settings)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget | null>(null)
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
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
  const defaultMonthBudget = settings?.defaultMonthBudget

  const budgetData = monthlyBudget
    ? getBudgetSummary(monthlyBudget, categoryBudgets, records, categories, currentMonth, today)
    : null
  const totalIncome = sumMoney(records.filter((record) => record.type === 'income').map((record) => record.amount))
  const totalBudgetStatus = budgetData?.summary
    ? getBudgetStatus(
        budgetData.summary.totalBudget > 0
          ? budgetData.summary.totalExpense / budgetData.summary.totalBudget
          : 0,
        getMonthProgress(today)
      )
    : 'normal'

  const createDefaultBudget = async () => {
    if (!defaultMonthBudget || defaultMonthBudget <= 0) return
    const now = new Date().toISOString()
    const [year, month] = currentMonth.split('-').map(Number)
    const previousDate = new Date(year, month - 2, 1)
    const previousMonth = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`
    const previousCategoryBudgets = await db.categoryBudgets
      .where({ month: previousMonth })
      .toArray()
    const newBudget: MonthlyBudget = {
      id: generateId(),
      month: currentMonth,
      totalBudget: defaultMonthBudget,
      createdAt: now,
      updatedAt: now,
    }
    const newCategoryBudgets: CategoryBudget[] = previousCategoryBudgets.map((budget) => ({
      id: generateId(),
      month: currentMonth,
      budgetCategoryId: budget.budgetCategoryId,
      amount: budget.amount,
      createdAt: now,
      updatedAt: now,
    }))

    await db.transaction('rw', db.monthlyBudgets, db.categoryBudgets, async () => {
      await db.monthlyBudgets.add(newBudget)
      if (newCategoryBudgets.length > 0) {
        await db.categoryBudgets.bulkAdd(newCategoryBudgets)
      }
    })
    setMonthlyBudget(newBudget)
    setCategoryBudgets(newCategoryBudgets)
  }

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
      {!monthlyBudget && _isCurrentMonth && (
        <EmptyState
          icon={'\u{1F4B0}'}
          title="先设置本月预算"
          description="预算是预算控制的第一步"
          actionLabel="去设置预算"
          onAction={() => navigate('/budget')}
        />
      )}

      {!monthlyBudget && !_isCurrentMonth && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <span className="text-5xl">{'\u{1F4B0}'}</span>
          <h3 className="text-lg font-medium text-foreground">该月份还未设置预算</h3>
          <p className="text-sm text-muted-foreground">可以手动设置历史月份预算</p>
          <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
            <Button onClick={() => navigate('/budget')} variant="default" className="w-full h-11 rounded-xl">
              手动设置预算
            </Button>
            {defaultMonthBudget && defaultMonthBudget > 0 && (
              <Button onClick={createDefaultBudget} variant="outline" className="w-full h-11 rounded-xl">
                使用默认预算创建
              </Button>
            )}
          </div>
        </div>
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
            totalIncome={totalIncome}
            budgetStatus={totalBudgetStatus}
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
              records={records}
              month={currentMonth}
            />
          )}
        </>
      )}

      {/* Quick add button */}
      {monthlyBudget && (
        <Button onClick={() => navigate('/add')} className="w-full h-11 rounded-xl font-medium">
          记一笔
        </Button>
      )}
    </div>
  )
}
