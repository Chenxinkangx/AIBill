import { formatMoney } from '@/utils/money'
import StatusBadge from '@/components/common/StatusBadge'

interface Props {
  type: 'unallocated' | 'exact' | 'overspent'
  diff: number
}

export default function BudgetAllocationHint({ type, diff }: Props) {
  if (type === 'exact') return null

  return (
    <div
      className={`rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 ${
        type === 'unallocated'
          ? 'bg-budget-green/10 text-budget-green'
          : 'bg-destructive/10 text-destructive'
      }`}
    >
      <StatusBadge
        status={type === 'unallocated' ? 'normal' : 'overspent'}
        label={type === 'unallocated' ? '未分配' : '超出预算'}
        size="sm"
      />
      <span>
        {type === 'unallocated' ? (
          <><strong>{formatMoney(diff)}</strong> 可自由支配</>
        ) : (
          <><strong>{formatMoney(diff)}</strong> 超出总预算</>
        )}
      </span>
    </div>
  )
}
