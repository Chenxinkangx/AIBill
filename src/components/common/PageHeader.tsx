import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export default function PageHeader({ title, subtitle, action, className = '' }: Props) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 ml-3">{action}</div>}
    </div>
  )
}
