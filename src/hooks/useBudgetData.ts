import { useEffect, useState, useCallback } from 'react'
import { db } from '../db/index'
import { getBudgetSummary, getBudgetAllocationDiff } from '../services/budget/calculator'
import type { Category, MonthlyBudget, CategoryBudget } from '../types'

/**
 * 聚合预算数据的 hook
 * 监听月份变化，自动加载并计算预算摘要
 */
export function useBudgetData(month: string, today: string) {
  const [loading, setLoading] = useState(true)
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget | null>(null)
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [mb, cbs, cats] = await Promise.all([
        db.monthlyBudgets.get({ month }),
        db.categoryBudgets.where({ month }).toArray(),
        db.categories.toArray(),
      ])
      setMonthlyBudget(mb ?? null)
      setCategoryBudgets(cbs)
      setCategories(cats)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    load()
  }, [load])

  const summary = monthlyBudget
    ? getBudgetSummary(monthlyBudget, categoryBudgets, [], categories, month, today)
    : null

  const allocationDiff = monthlyBudget
    ? getBudgetAllocationDiff(monthlyBudget.totalBudget, categoryBudgets)
    : null

  const refresh = load

  return {
    loading,
    monthlyBudget,
    categoryBudgets,
    categories: categories.filter((c) => c.budgetable && !c.archived).sort((a, b) => a.order - b.order),
    summary,
    allocationDiff,
    refresh,
  }
}
