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
  const navigate = useNavigate()

  const {
    groupedRecords,
    sortedDates,
    categories,
    loading,
    refresh,
    getCategoryName,
  } = useRecords(currentMonth, selectedCategoryIds)

  const budgetableCategories = categories.filter(
    (c) => c.budgetable || c.id === 'income'
  )

  // Collect unique categories used across all budgetable + income
  const filterOptions = [
    { id: 'all', name: '全部分类' },
    ...budgetableCategories.map((c) => ({ id: c.id, name: c.name })),
  ]
  const selectedCount = selectedCategoryIds.length

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
          <p className="text-sm font-medium text-gray-700">分类筛选</p>
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
            onUpdated={refresh}
            onDeleted={refresh}
          />
        ))}
      </div>
    </div>
  )
}
