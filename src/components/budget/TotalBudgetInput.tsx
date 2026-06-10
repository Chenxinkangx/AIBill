import { formatMoney } from '../../utils/money'

interface Props {
  totalBudget: number
  onChange: (value: number) => void
}

export default function TotalBudgetInput({ totalBudget, onChange }: Props) {
  return (
    <div className="bg-white rounded-xl p-4 space-y-2">
      <label className="text-sm text-gray-500 font-medium">本月总预算</label>
      <div className="flex items-center gap-2">
        <span className="text-xl text-gray-400">¥</span>
        <input
          type="number"
          value={totalBudget || ''}
          min="0"
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          placeholder="输入月度总预算"
          className="flex-1 text-2xl font-bold text-gray-800 outline-none bg-transparent placeholder:text-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      {totalBudget > 0 && (
        <p className="text-xs text-gray-400">
          日均可用：{formatMoney(Math.round(totalBudget / 30))}
        </p>
      )}
    </div>
  )
}
