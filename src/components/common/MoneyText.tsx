import { formatMoney } from '@/utils/money'

interface Props {
  amount: number
  type?: 'income' | 'expense'
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  showSign?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'text-sm font-medium',
  base: 'text-base font-semibold',
  lg: 'text-lg font-semibold',
  xl: 'text-xl font-bold',
  '2xl': 'text-4xl font-bold',
}

export default function MoneyText({ amount, type, size = 'base', showSign = false, className = '' }: Props) {
  const color =
    type === 'income'
      ? 'text-budget-green'
      : type === 'expense' && amount > 0
        ? 'text-foreground'
        : 'text-foreground'

  const sign = showSign ? (type === 'income' ? '+' : '-') : ''

  return (
    <span className={`tabular-nums ${sizeClasses[size]} ${color} ${className}`}>
      {sign}{formatMoney(amount)}
    </span>
  )
}
