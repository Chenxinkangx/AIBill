import { useEffect } from 'react'
import type { CategoryBudgetStatus, RecordItem } from '../../types'
import { formatMoney } from '../../utils/money'

interface Props {
  category: CategoryBudgetStatus | null
  records: RecordItem[]
  month: string
  onClose: () => void
}

export default function CategorySpendingDialog({ category, records, month, onClose }: Props) {
  useEffect(() => {
    if (!category) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [category, onClose])

  if (!category) return null

  const categoryRecords = records
    .filter(
      (record) =>
        record.type === 'expense' &&
        record.budgetCategoryId === category.budgetCategoryId
    )
    .sort((a, b) => {
      const dateDifference = b.date.localeCompare(a.date)
      if (dateDifference !== 0) return dateDifference
      return b.createdAt.localeCompare(a.createdAt)
    })

  const overspentAmount = Math.max(0, category.spent - category.budget)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center sm:px-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-spending-title"
        className="flex max-h-[78vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-sm sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 id="category-spending-title" className="text-lg font-semibold text-gray-900">
              {category.categoryName}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">{formatMonth(month)}支出明细</p>
          </div>
          <button
            type="button"
            aria-label="关闭支出明细"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl leading-none text-gray-600 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            ×
          </button>
        </header>

        <div className="grid grid-cols-3 gap-2 bg-gray-50 px-4 py-3 text-center">
          <SummaryItem label="已花" value={formatMoney(category.spent)} />
          <SummaryItem label="预算" value={formatMoney(category.budget)} />
          <SummaryItem
            label={overspentAmount > 0 ? '超支' : '剩余'}
            value={formatMoney(overspentAmount > 0 ? overspentAmount : category.remaining)}
            danger={overspentAmount > 0}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2">
          {categoryRecords.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {categoryRecords.map((record) => (
                <div key={record.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{record.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatRecordDate(record.date)}</p>
                    {record.note && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{record.note}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                    -{formatMoney(record.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-gray-600">这个月还没有相关支出</p>
              <p className="mt-1 text-xs text-gray-500">记账后会显示在这里</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-3 safe-area-bottom">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            关闭明细
          </button>
        </div>
      </section>
    </div>
  )
}

function SummaryItem({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`mt-0.5 truncate text-xs font-semibold tabular-nums ${danger ? 'text-red-600' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  )
}

function formatRecordDate(date: string): string {
  const [, month, day] = date.split('-')
  return `${Number(month)}月${Number(day)}日`
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-')
  return `${year}年${Number(monthNumber)}月`
}
