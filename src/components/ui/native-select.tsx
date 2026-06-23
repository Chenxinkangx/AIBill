import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[]
  placeholder?: string
}

const NativeSelect = forwardRef<HTMLSelectElement, Props>(
  ({ options, placeholder, className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-11 w-full min-w-0 rounded-xl border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'md:text-sm',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }
)

NativeSelect.displayName = 'NativeSelect'

export { NativeSelect }
