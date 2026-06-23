import { cn } from '@/lib/utils'

type Status = 'normal' | 'warning' | 'critical' | 'overspent'

interface Props {
  status: Status
  label?: string
  size?: 'sm' | 'default'
  className?: string
}

const STATUS_LABELS: Record<Status, string> = {
  normal: '正常',
  warning: '接近上限',
  critical: '即将超支',
  overspent: '已超支',
}

const statusStyles: Record<Status, string> = {
  normal: 'bg-budget-green/10 text-budget-green',
  warning: 'bg-budget-yellow/10 text-budget-yellow',
  critical: 'bg-destructive/10 text-destructive',
  overspent: 'bg-destructive/15 text-destructive',
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  default: 'px-2 py-0.5 text-xs',
}

export default function StatusBadge({ status, label, size = 'default', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium leading-none',
        sizeStyles[size],
        statusStyles[status],
        className
      )}
    >
      {label ?? STATUS_LABELS[status]}
    </span>
  )
}
