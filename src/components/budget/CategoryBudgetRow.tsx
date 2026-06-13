import { formatMoney, formatPercent } from '../../utils/money'
import BudgetProgressBar from './BudgetProgressBar'

interface Props {
  name: string
  icon?: string
  budget: number
  spent: number
  usageRate: number
  status: 'normal' | 'warning' | 'critical' | 'overspent'
  onBudgetChange: (value: number) => void
  onRename?: () => void
  onArchive?: () => void
}

export default function CategoryBudgetRow({
  name,
  icon,
  budget,
  spent,
  usageRate,
  status,
  onBudgetChange,
  onRename,
  onArchive,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-4 space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon || '📦'}</span>
          <span className="font-medium text-gray-800">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {formatMoney(spent)} / {formatMoney(budget || 0)}
          </span>
          {onRename && (
            <button
              type="button"
              onClick={onRename}
              className="text-xs text-gray-300 hover:text-indigo-500"
            >
              编辑
            </button>
          )}
          {onArchive && (
            <button
              type="button"
              onClick={onArchive}
              className="text-xs text-gray-300 hover:text-red-500"
            >
              归档
            </button>
          )}
        </div>
      </div>

      {/* Budget Input */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">预算</span>
        <input
          type="number"
          value={budget || ''}
          min="0"
          onChange={(e) => onBudgetChange(Math.max(0, Number(e.target.value) || 0))}
          placeholder="0"
          className="flex-1 text-sm font-medium text-gray-700 outline-none bg-gray-50 rounded-lg px-3 py-1.5 placeholder:text-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Progress Bar */}
      <BudgetProgressBar usageRate={usageRate} status={status} />

      {/* Status Label */}
      {budget > 0 && (
        <div className="flex justify-between text-xs">
          <span
            className={
              status === 'overspent'
                ? 'text-gray-950'
                : status === 'critical'
                  ? 'text-red-500'
                : status === 'warning'
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }
          >
            {status === 'overspent'
              ? `超支 ${formatMoney(spent - budget)}`
              : status === 'critical'
                ? '预算极限'
                : status === 'warning'
                  ? '预算紧张'
                  : '预算宽裕'}
          </span>
          <span className="text-gray-400">{formatPercent(usageRate)}</span>
        </div>
      )}
    </div>
  )
}
