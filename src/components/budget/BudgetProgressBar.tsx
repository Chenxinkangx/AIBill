interface Props {
  usageRate: number
  status: 'normal' | 'warning' | 'critical' | 'overspent'
  height?: number
}

const STATUS_COLORS = {
  normal: 'bg-green-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500',
  overspent: 'bg-gray-950',
}

const STATUS_BG = {
  normal: 'bg-green-100',
  warning: 'bg-yellow-100',
  critical: 'bg-red-100',
  overspent: 'bg-gray-200',
}

export default function BudgetProgressBar({ usageRate, status, height = 6 }: Props) {
  const percent = Math.min(usageRate * 100, 100)

  return (
    <div className={`w-full rounded-full ${STATUS_BG[status]}`} style={{ height }}>
      <div
        className={`${STATUS_COLORS[status]} rounded-full transition-all duration-300`}
        style={{ width: `${percent}%`, height }}
      />
    </div>
  )
}
