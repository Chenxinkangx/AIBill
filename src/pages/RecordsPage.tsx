import { useState } from 'react'
import { useRecords } from '../hooks/useRecords'
import { useAppStore } from '../stores/appStore'
import MonthPicker from '../components/common/MonthPicker'
import RecordGroup from '../components/records/RecordGroup'
import EmptyState from '../components/common/EmptyState'
import { useNavigate } from 'react-router-dom'

export default function RecordsPage() {
  const currentMonth = useAppStore((s) => s.currentMonth)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const navigate = useNavigate()

  const {
    groupedRecords,
    sortedDates,
    categories,
    loading,
    refresh,
    getCategoryName,
  } = useRecords(currentMonth, categoryFilter)

  const budgetableCategories = categories.filter(
    (c) => c.budgetable || c.id === 'income'
  )

  // Collect unique categories used across all budgetable + income
  const filterOptions = [
    { id: 'all', name: '全部分类' },
    ...budgetableCategories.map((c) => ({ id: c.id, name: c.name })),
  ]

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
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setCategoryFilter(opt.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === opt.id
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {opt.name}
          </button>
        ))}
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
