import { formatMoney } from '../../utils/money'

interface Props {
  type: 'unallocated' | 'exact' | 'overspent'
  diff: number
}

export default function BudgetAllocationHint({ type, diff }: Props) {
  if (type === 'exact') return null

  return (
    <div
      className={`rounded-xl px-4 py-2.5 text-sm ${
        type === 'unallocated'
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-600'
      }`}
    >
      {type === 'unallocated' ? (
        <span>
          未分配预算 <strong>{formatMoney(diff)}</strong>，可自由支配
        </span>
      ) : (
        <span>
          分类预算超出总预算 <strong>{formatMoney(diff)}</strong>
        </span>
      )}
    </div>
  )
}
