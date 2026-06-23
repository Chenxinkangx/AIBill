import { Card } from '@/components/ui/card'
import { formatMoney, formatPercent } from '@/utils/money'

interface Props {
  totalBudget: number
  totalExpense: number
  remaining: number
  isOverspent: boolean
  todaySuggested: number | null
  monthlySurplus?: number
  isCurrentMonth: boolean
  totalIncome?: number
  budgetStatus?: 'normal' | 'warning' | 'critical' | 'overspent'
}

export default function BudgetSummary({
  totalBudget,
  totalExpense,
  remaining,
  isOverspent,
  todaySuggested,
  monthlySurplus,
  isCurrentMonth,
  totalIncome = 0,
  budgetStatus,
}: Props) {
  const usageRate = totalBudget > 0 ? totalExpense / totalBudget : 0
  const progressStatus = budgetStatus ?? (isOverspent ? 'overspent' : 'normal')

  const progressColor =
    progressStatus === 'overspent'
      ? 'bg-foreground'
      : progressStatus === 'critical'
        ? 'bg-destructive'
        : progressStatus === 'warning'
          ? 'bg-budget-yellow'
          : 'bg-budget-green'

  return (
    <Card className="p-5 space-y-4 rounded-2xl">
      {/* Main remaining amount */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">
          {isCurrentMonth ? '本月还可以花' : '当月结余'}
        </p>
        <p
          className={`text-4xl font-bold ${
            isOverspent ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {formatMoney(isOverspent ? 0 : remaining)}
        </p>
        {isOverspent && (
          <p className="text-xs text-destructive mt-1">
            已超支 {formatMoney(totalExpense - totalBudget)}
          </p>
        )}
      </div>

      {/* Today suggested (current month only) */}
      {isCurrentMonth && todaySuggested !== null && !isOverspent && (
        <div className="bg-primary/10 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-primary font-medium">今天建议最多花</p>
          <p className="text-xl font-bold text-primary">
            {formatMoney(todaySuggested)}
          </p>
        </div>
      )}

      {/* Historical month surplus */}
      {!isCurrentMonth && monthlySurplus !== undefined && (
        <div className="bg-muted rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground font-medium">当月结余</p>
          <p className="text-xl font-bold text-foreground">
            {formatMoney(monthlySurplus)}
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>已花 {formatMoney(totalExpense)}</span>
          <span>预算 {formatMoney(totalBudget)}</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(usageRate * 100, 100)}%` }}
          />
        </div>
        <p className="text-right text-xs text-muted-foreground">
          已使用 {formatPercent(usageRate)}
        </p>
      </div>

      {totalIncome > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
          <span>本月收入</span>
          <span className="font-medium text-budget-green">{formatMoney(totalIncome)}</span>
        </div>
      )}
    </Card>
  )
}
