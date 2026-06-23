import { Input } from '@/components/ui/input'
import StatusBadge from '@/components/common/StatusBadge'
import { formatMoney, formatPercent } from '@/utils/money'
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
    <div className="bg-card rounded-xl p-4 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon || '📦'}</span>
          <span className="font-medium text-foreground">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatMoney(spent)} / {formatMoney(budget || 0)}
          </span>
          {onRename && (
            <button
              type="button"
              onClick={onRename}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              编辑
            </button>
          )}
          {onArchive && (
            <button
              type="button"
              onClick={onArchive}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              归档
            </button>
          )}
        </div>
      </div>

      {/* Budget Input */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">预算</span>
        <Input
          type="number"
          value={budget || ''}
          min="0"
          onChange={(e) => onBudgetChange(Math.max(0, Number(e.target.value) || 0))}
          placeholder="0"
          className="flex-1 h-8 text-sm font-medium rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Progress Bar */}
      <BudgetProgressBar usageRate={usageRate} status={status} />

      {/* Status Label */}
      {budget > 0 && (
        <div className="flex justify-between items-center text-xs">
          <StatusBadge status={status} size="sm" />
          <span className="text-muted-foreground">{formatPercent(usageRate)}</span>
        </div>
      )}
    </div>
  )
}
