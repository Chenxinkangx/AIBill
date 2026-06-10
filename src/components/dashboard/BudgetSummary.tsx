import { formatMoney, formatPercent } from '../../utils/money'

interface Props {
  totalBudget: number
  totalExpense: number
  remaining: number
  isOverspent: boolean
  todaySuggested: number | null
  monthlySurplus?: number
  isCurrentMonth: boolean
  totalIncome?: number
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
}: Props) {
  const usageRate = totalBudget > 0 ? totalExpense / totalBudget : 0

  return (
    <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
      {/* Main remaining amount */}
      <div className="text-center">
        <p className="text-sm text-gray-400 mb-1">
          {isCurrentMonth ? '本月还可以花' : '当月结余'}
        </p>
        <p
          className={`text-4xl font-bold ${
            isOverspent ? 'text-red-500' : 'text-gray-900'
          }`}
        >
          {formatMoney(isOverspent ? 0 : remaining)}
        </p>
        {isOverspent && (
          <p className="text-xs text-red-500 mt-1">
            已超支 {formatMoney(totalExpense - totalBudget)}
          </p>
        )}
      </div>

      {/* Today suggested (current month only) */}
      {isCurrentMonth && todaySuggested !== null && !isOverspent && (
        <div className="bg-indigo-50 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-indigo-500 font-medium">今天建议最多花</p>
          <p className="text-xl font-bold text-indigo-600">
            {formatMoney(todaySuggested)}
          </p>
        </div>
      )}

      {/* Historical month surplus */}
      {!isCurrentMonth && monthlySurplus !== undefined && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-gray-500 font-medium">当月结余</p>
          <p className="text-xl font-bold text-gray-700">
            {formatMoney(monthlySurplus)}
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>已花 {formatMoney(totalExpense)}</span>
          <span>预算 {formatMoney(totalBudget)}</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverspent
                ? 'bg-red-500'
                : usageRate > 0.7
                  ? 'bg-yellow-500'
                  : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(usageRate * 100, 100)}%` }}
          />
        </div>
        <p className="text-right text-xs text-gray-400">
          已使用 {formatPercent(usageRate)}
        </p>
      </div>

      {totalIncome > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3">
          <span>本月收入</span>
          <span className="font-medium text-green-600">{formatMoney(totalIncome)}</span>
        </div>
      )}
    </div>
  )
}
