import type {
  RecordItem,
  Category,
  CategoryBudget,
  MonthlyBudget,
  BudgetSummary,
  CategoryBudgetStatus,
} from '../../types'
import { getRemainingDaysInCurrentMonth, getMonthProgress, getMonthDateRange, isCurrentMonth } from '../../utils/date'
import { sumMoney } from '../../utils/money'

/**
 * 计算某月份的总支出金额
 */
export function getMonthlyExpense(records: RecordItem[], month: string): number {
  const { startDate, endDate } = getMonthDateRange(month)
  const amounts = records
    .filter((r) => r.type === 'expense' && r.date >= startDate && r.date <= endDate)
    .map((r) => r.amount)
  return sumMoney(amounts)
}

/**
 * 计算某月份某分类的支出金额
 */
export function getCategoryExpense(
  records: RecordItem[],
  month: string,
  categoryId: string
): number {
  const { startDate, endDate } = getMonthDateRange(month)
  const amounts = records
    .filter(
      (r) =>
        r.type === 'expense' &&
        r.categoryId === categoryId &&
        r.date >= startDate &&
        r.date <= endDate
    )
    .map((r) => r.amount)
  return sumMoney(amounts)
}

/**
 * 计算本月剩余金额
 */
export function getMonthlyRemaining(
  totalBudget: number,
  monthlyExpense: number
): { remaining: number; isOverspent: boolean } {
  const remaining = totalBudget - monthlyExpense
  return {
    remaining: remaining < 0 ? 0 : remaining,
    isOverspent: remaining < 0,
  }
}

/**
 * 计算分类剩余金额
 */
export function getCategoryRemaining(budget: number, spent: number): number {
  return Math.max(0, budget - spent)
}

/**
 * 计算今日建议可花金额
 * 当前月返回计算值，历史月份返回 null
 */
export function getTodaySuggestedAmount(
  remaining: number,
  month: string,
  today: string
): number | null {
  if (!isCurrentMonth(month)) return null
  if (remaining <= 0) return 0
  const daysLeft = getRemainingDaysInCurrentMonth(today)
  if (daysLeft <= 0) return 0
  return Math.round(remaining / daysLeft)
}

/**
 * 根据使用率和月份进度判断预算状态
 */
export function getBudgetStatus(
  usageRate: number,
  monthProgress: number
): 'normal' | 'warning' | 'critical' | 'overspent' {
  if (usageRate >= 1) return 'overspent'
  if (usageRate >= 0.85) return 'critical'
  if (usageRate > monthProgress + 0.2) return 'warning'
  return 'normal'
}

/**
 * 计算总预算与分类预算合计的差异
 */
export function getBudgetAllocationDiff(
  totalBudget: number,
  categoryBudgets: CategoryBudget[]
): { diff: number; type: 'unallocated' | 'exact' | 'overspent' } {
  const totalAllocated = categoryBudgets.reduce((sum, cb) => sum + cb.amount, 0)
  const diff = totalBudget - totalAllocated
  if (diff > 0) return { diff, type: 'unallocated' }
  if (diff === 0) return { diff: 0, type: 'exact' }
  return { diff: Math.abs(diff), type: 'overspent' }
}

/**
 * 获取某月份所有分类的预算状态列表
 */
export function getCategoryBudgetStatuses(
  categories: Category[],
  categoryBudgets: CategoryBudget[],
  records: RecordItem[],
  month: string,
  today: string
): CategoryBudgetStatus[] {
  const monthProgress = getMonthProgress(today)
  const budgetableCategories = categories.filter((c) => c.budgetable && !c.archived)

  return budgetableCategories.map((cat) => {
    const budgetRow = categoryBudgets.find((cb) => cb.categoryId === cat.id)
    const budget = budgetRow?.amount ?? 0
    const spent = getCategoryExpense(records, month, cat.id)
    const usageRate = budget > 0 ? spent / budget : 0

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      budget,
      spent,
      remaining: getCategoryRemaining(budget, spent),
      usageRate,
      status: budget > 0 ? getBudgetStatus(usageRate, monthProgress) : 'normal',
    }
  })
}

/**
 * 获取某月份的完整预算摘要
 */
export function getBudgetSummary(
  monthlyBudget: MonthlyBudget | null,
  categoryBudgets: CategoryBudget[],
  records: RecordItem[],
  categories: Category[],
  month: string,
  today: string
): {
  summary: BudgetSummary | null
  categoryStatuses: CategoryBudgetStatus[]
  allocationDiff: { diff: number; type: 'unallocated' | 'exact' | 'overspent' } | null
} {
  if (!monthlyBudget) {
    return {
      summary: null,
      categoryStatuses: [],
      allocationDiff: null,
    }
  }

  const totalExpense = getMonthlyExpense(records, month)
  const { remaining, isOverspent } = getMonthlyRemaining(
    monthlyBudget.totalBudget,
    totalExpense
  )
  const todaySuggested = getTodaySuggestedAmount(remaining, month, today)

  // For historical months, calculate monthly surplus
  const monthlySurplus = !isCurrentMonth(month) ? remaining : undefined

  const summary: BudgetSummary = {
    month,
    totalBudget: monthlyBudget.totalBudget,
    totalExpense,
    remaining,
    isOverspent,
    todaySuggested,
    monthlySurplus,
  }

  const categoryStatuses = getCategoryBudgetStatuses(
    categories,
    categoryBudgets,
    records,
    month,
    today
  )

  const allocationDiff = getBudgetAllocationDiff(
    monthlyBudget.totalBudget,
    categoryBudgets
  )

  return {
    summary,
    categoryStatuses,
    allocationDiff,
  }
}
