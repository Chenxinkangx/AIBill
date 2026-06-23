import type { Tag } from '@/types'

interface Props {
  tags: Tag[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  compact?: boolean
}

export default function TagSelector({ tags, selectedIds, onChange, compact = false }: Props) {
  const activeTags = tags.filter((tag) => !tag.archived).sort((a, b) => a.order - b.order)

  if (activeTags.length === 0) {
    return <p className="text-xs text-muted-foreground">还没有标签，可在设置中创建</p>
  }

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeTags.map((tag) => {
        const selected = selectedIds.includes(tag.id)
        return (
          <button
            key={tag.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(tag.id)}
            className={`rounded-full border font-medium transition-all ${
              compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            } ${
              selected
                ? 'border-gray-700 bg-foreground text-white shadow-sm'
                : 'border-border bg-white text-foreground hover:border-gray-300'
            }`}
          >
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: tag.color || '#E5E7EB' }}
            />
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}
