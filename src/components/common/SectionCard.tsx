import type { ReactNode } from 'react'

interface Props {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export default function SectionCard({ title, description, action, children, className = '' }: Props) {
  return (
    <section className={`space-y-3 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-1">
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground/70">{description}</p>}
          </div>
          {action && <div className="shrink-0 ml-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
