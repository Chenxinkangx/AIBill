import type { ReactNode } from 'react'

interface Props {
  label?: string
  error?: string
  description?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export default function FormField({ label, error, description, required, children, className = '' }: Props) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      {children}
      {description && !error && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
