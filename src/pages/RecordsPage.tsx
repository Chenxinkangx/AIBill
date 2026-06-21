import { useState } from 'react'
import { useRecords } from '../hooks/useRecords'
import { useAppStore } from '../stores/appStore'
import MonthPicker from '../components/common/MonthPicker'
import RecordGroup from '../components/records/RecordGroup'
import EmptyState from '../components/common/EmptyState'
import { useNavigate } from 'react-router-dom'

export default function RecordsPage() {
  const currentMonth = useAppStore((s) => s.currentMonth)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const navigate = useNavigate()

  const {
    groupedRecords,
    sortedDates,
    categories,
    tags,
    loading,
    refresh,
    getCategoryName,
  } = useRecords(currentMonth, selectedCategoryIds, selectedTagIds)

  const budgetableCategories = categories.filter(
    (c) => c.budgetable || c.id === 'income'
  )

  // Collect unique categories used across all budgetable + income
  const filterOptions = [
    { id: 'all', name: '全部分类' },
    ...budgetableCategories.map((c) => ({ id: c.id, name: c.name })),
  ]
  const selectedCount = selectedCategoryIds.length
  const activeTags = tags.filter((tag) => !tag.archived).sort((a, b) => a.order - b.order)

  const toggleCategory = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedCategoryIds([])
      return
    }

    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((previous) =>
      previous.includes(tagId)
        ? previous.filter((id) => id !== tagId)
        : [...previous, tagId]
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <MonthPicker />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MonthPicker />

      {/* Filter */}
      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-gray-100/80">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">预算分类筛选</p>
          <p className="text-xs text-gray-400">
            {selectedCount > 0 ? `已选 ${selectedCount} 个` : '默认全部'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => {
            const active =
              opt.id === 'all'
                ? selectedCategoryIds.length === 0
                : selectedCategoryIds.includes(opt.id)

            return (
              <button
                key={opt.id}
                onClick={() => toggleCategory(opt.id)}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.name}
              </button>
            )
          })}
        </div>
      </div>

      {activeTags.length > 0 && (
        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-gray-100/80">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">标签筛选</p>
            <button type="button" onClick={() => setSelectedTagIds([])} className="text-xs text-gray-400">
              {selectedTagIds.length > 0 ? '清除' : '包含任一标签'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTags.map((tag) => {
              const active = selectedTagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${active ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-600'}`}
                >
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedDates.length === 0 && (
        <EmptyState
          title="还没有账单"
          description="记一笔吧，让 AI 帮你管好预算"
          actionLabel="去记账"
          onAction={() => navigate('/add')}
        />
      )}

      {/* Records by date group */}
      <div className="space-y-3">
        {sortedDates.map((date) => (
          <RecordGroup
            key={date}
            date={date}
            records={groupedRecords[date]}
            getCategoryName={getCategoryName}
            categories={budgetableCategories}
            tags={tags}
            onUpdated={refresh}
            onDeleted={refresh}
          />
        ))}
      </div>
    </div>
  )
}
