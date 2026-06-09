import type { CategoryBudgetStatus } from '../../types'
import { formatMoney, formatPercent } from '../../utils/money'

interface Props {
  categoryStatuses: CategoryBudgetStatus[]
}

const STATUS_STYLES = {
  normal: {
    bar: 'bg-green-500',
    bg: 'bg-green-100',
    text: 'text-green-600',
  },
  warning: {
    bar: 'bg-yellow-500',
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
  },
  overspent: {
    bar: 'bg-red-500',
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
} as const

export default function CategoryProgressList({ categoryStatuses }: Props) {
  if (categoryStatuses.length === 0) return null

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-gray-500 px-1">分类预算</h2>
      <div className="space-y-2">
        {categoryStatuses.map((cat) => {
          const style = STATUS_STYLES[cat.status]
          const percent = Math.min(cat.usageRate * 100, 100)

          return (
            <div
              key={cat.categoryId}
              className="bg-white rounded-xl px-4 py-3 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">
                  {cat.categoryName}
                </span>
                {cat.budget > 0 && (
                  <span className={`text-xs font-medium ${style.text}`}>
                    {formatPercent(cat.usageRate)}
                  </span>
                )}
              </div>

              {cat.budget > 0 ? (
                <>
                  <div className={`w-full h-2 rounded-full ${style.bg}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${style.bar}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>已花 {formatMoney(cat.spent)}</span>
                    <span>剩余 {formatMoney(cat.remaining)}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-300">未设置预算</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
