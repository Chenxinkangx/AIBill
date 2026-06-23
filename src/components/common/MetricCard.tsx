import type { ReactNode } from 'react'

interface Props {
  label: string
  value: ReactNode
  change?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  className?: string
}

const trendColors = {
  up: 'text-budget-green',
  down: 'text-budget-red',
  neutral: 'text-muted-foreground',
}

export default function MetricCard({ label, value, change, trend, icon, className = '' }: Props) {
  return (
    <div className={`rounded-xl bg-card p-4 ring-1 ring-foreground/5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="mt-1 text-2xl font-bold text-foreground tabular-nums">{value}</div>
          {change && (
            <p className={`mt-0.5 text-xs font-medium ${trend ? trendColors[trend] : 'text-muted-foreground'}`}>
              {change}
            </p>
          )}
        </div>
        {icon && <div className="shrink-0 ml-3 text-muted-foreground">{icon}</div>}
      </div>
    </div>
  )
}
