import { Button } from '@/components/ui/button'

interface Props {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon = '\u{1F4CB}',
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <span className="text-5xl">{icon}</span>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2 px-6 h-11 rounded-xl text-sm font-medium">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
