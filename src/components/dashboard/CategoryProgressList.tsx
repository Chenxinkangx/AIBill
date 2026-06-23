import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import type { CategoryBudgetStatus, RecordItem } from '@/types'
import { formatMoney } from '@/utils/money'
import CategorySpendingDialog from './CategorySpendingDialog'

interface Props {
  categoryStatuses: CategoryBudgetStatus[]
  records: RecordItem[]
  month: string
}

const RADIUS = 48
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const STATUS_STYLES = {
  normal: {
    progress: 'stroke-emerald-500',
    track: 'stroke-emerald-100',
    text: 'text-emerald-700',
  },
  warning: {
    progress: 'stroke-amber-500',
    track: 'stroke-amber-100',
    text: 'text-amber-700',
  },
  critical: {
    progress: 'stroke-red-500',
    track: 'stroke-red-100',
    text: 'text-red-600',
  },
  overspent: {
    progress: 'stroke-red-600',
    track: 'stroke-red-100',
    text: 'text-red-700',
  },
} as const

export default function CategoryProgressList({ categoryStatuses, records, month }: Props) {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<CategoryBudgetStatus | null>(null)
  if (categoryStatuses.length === 0) return null

  const fundedCategories = categoryStatuses.filter((category) => category.budget > 0)
  const unbudgetedCount = categoryStatuses.length - fundedCategories.length

  return (
    <section className="space-y-2" aria-labelledby="category-budget-title">
      <div className="flex items-center justify-between px-1">
        <h2 id="category-budget-title" className="text-sm font-medium text-muted-foreground">
          分类预算
        </h2>
        <span className="text-xs text-muted-foreground">圆弧表示已花比例</span>
      </div>

      {fundedCategories.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {fundedCategories.map((category) => (
            <BudgetRing
              key={category.budgetCategoryId}
              category={category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      )}

      {unbudgetedCount > 0 && (
        <button
          type="button"
          onClick={() => navigate('/budget')}
          className="flex w-full items-center justify-between rounded-xl bg-card px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span>
            <span className="block text-sm font-medium text-foreground">
              {unbudgetedCount} 个分类未设置预算
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">设置后会显示在预算圆环中</span>
          </span>
          <span aria-hidden="true" className="text-lg text-muted-foreground">›</span>
        </button>
      )}

      <CategorySpendingDialog
        category={selectedCategory}
        records={records}
        month={month}
        onClose={() => setSelectedCategory(null)}
      />
    </section>
  )
}

function BudgetRing({ category, onClick }: { category: CategoryBudgetStatus; onClick: () => void }) {
  const style = STATUS_STYLES[category.status]
  const usageRate = Math.max(0, Math.min(category.spent / category.budget, 1))
  const dashOffset = CIRCUMFERENCE * (1 - usageRate)
  const overspentAmount = Math.max(0, category.spent - category.budget)
  const isOverspent = overspentAmount > 0
  const isExhausted = !isOverspent && category.remaining <= 0
  const primaryAmount = isOverspent ? overspentAmount : category.remaining
  const amountText = formatMoney(primaryAmount)
  const amountSize = amountText.length >= 10
    ? 'text-xs'
    : amountText.length >= 8
      ? 'text-sm'
      : 'text-base'

  const stateLabel = isOverspent ? '超支' : isExhausted ? '已用完' : '剩余'
  const accessibleLabel = `${category.categoryName}预算，${stateLabel}${amountText}，已花${formatMoney(category.spent)}，总预算${formatMoney(category.budget)}`

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`查看${category.categoryName}本月支出明细`}
      className="min-w-0 rounded-xl bg-card px-1.5 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div
        title={accessibleLabel}
        className={`relative mx-auto aspect-square w-full max-w-[94px] ${isExhausted || isOverspent ? 'rounded-full ring-2 ring-destructive/30' : ''}`}
      >
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="9"
            className={style.track}
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={`budget-ring-progress ${style.progress}`}
          />
        </svg>

        <div className="absolute inset-[16%] flex flex-col items-center justify-center text-center">
          <span className="max-w-full truncate text-xs font-semibold leading-tight text-foreground">
            {category.categoryName}
          </span>
          <span className={`mt-0.5 text-[9px] font-medium ${style.text}`}>{stateLabel}</span>
          <span className={`${amountSize} mt-0.5 whitespace-nowrap font-bold leading-none text-foreground`}>
            {amountText}
          </span>
        </div>
      </div>

      <div className="mt-1.5 min-w-0 space-y-0.5 text-center text-[10px] leading-4 text-muted-foreground">
        <p className="truncate tabular-nums">已花 {formatMoney(category.spent)}</p>
        <p className="truncate tabular-nums">预算 {formatMoney(category.budget)}</p>
      </div>
    </button>
  )
}
