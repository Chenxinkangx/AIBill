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
      <h3 className="text-lg font-medium text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
