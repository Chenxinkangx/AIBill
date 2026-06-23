import { Card } from '@/components/ui/card'
import { formatMoney, formatPercent } from '@/utils/money'
import MetricCard from '@/components/common/MetricCard'
import StatusBadge from '@/components/common/StatusBadge'

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
  const status = budgetStatus ?? (isOverspent ? 'overspent' : 'normal')

  const progressBarColor =
    status === 'overspent'
      ? 'bg-foreground'
      : status === 'critical'
        ? 'bg-destructive'
        : status === 'warning'
          ? 'bg-budget-yellow'
          : 'bg-budget-green'

  return (
    <Card className="overflow-hidden rounded-2xl border-0">
      {/* Gradient header area */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-muted-foreground">
            {isCurrentMonth ? '本月还可以花' : '当月结余'}
          </p>
          <StatusBadge status={status} size="sm" />
        </div>

        <p className={`text-4xl font-bold tracking-tight tabular-nums ${isOverspent ? 'text-destructive' : 'text-foreground'}`}>
          {formatMoney(isOverspent ? 0 : remaining)}
        </p>

        {isOverspent && (
          <p className="text-sm text-destructive mt-1">
            已超支 {formatMoney(totalExpense - totalBudget)}
          </p>
        )}
      </div>

      {/* Today suggested / monthly surplus */}
      {(isCurrentMonth && todaySuggested !== null && !isOverspent) && (
        <div className="mx-4 mt-3 mb-1">
          <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-2.5">
            <span className="text-xs font-medium text-primary">今天建议最多花</span>
            <span className="text-lg font-bold text-primary tabular-nums">
              {formatMoney(todaySuggested)}
            </span>
          </div>
        </div>
      )}

      {!isCurrentMonth && monthlySurplus !== undefined && (
        <div className="mx-4 mt-3 mb-1">
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">当月结余</span>
            <span className="text-lg font-bold text-foreground tabular-nums">
              {formatMoney(monthlySurplus)}
            </span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="px-5 pt-3 pb-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>已花 {formatMoney(totalExpense)}</span>
            <span>预算 {formatMoney(totalBudget)}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
              style={{ width: `${Math.min(usageRate * 100, 100)}%` }}
            />
          </div>
          <p className="text-right text-[11px] text-muted-foreground">
            已使用 {formatPercent(usageRate)}
          </p>
        </div>

        {/* Bottom metrics row */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
          <MetricCard
            label="已支出"
            value={formatMoney(totalExpense)}
            className="!p-0 !bg-transparent"
          />
          <MetricCard
            label="本月收入"
            value={<span className="text-budget-green">{formatMoney(totalIncome)}</span>}
            className="!p-0 !bg-transparent"
          />
        </div>
      </div>
    </Card>
  )
}
