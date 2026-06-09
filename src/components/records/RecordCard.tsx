import { useState } from 'react'
import type { RecordItem, Category } from '../../types'
import { formatMoney } from '../../utils/money'
import RecordActions from './RecordActions'

interface Props {
  record: RecordItem
  categoryName: string
  categories: Category[]
  onUpdated: () => void
  onDeleted: () => void
}

export default function RecordCard({ record, categoryName, categories, onUpdated, onDeleted }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs text-gray-400 w-8 shrink-0">
            {record.type === 'income' ? '📥' : '📤'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {record.title}
            </p>
            <span className="text-xs text-gray-400">{categoryName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-sm font-semibold ${
              record.type === 'income' ? 'text-green-600' : 'text-gray-800'
            }`}
          >
            {record.type === 'income' ? '+' : '-'}
            {formatMoney(record.amount)}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="4" r="1.5" fill="currentColor" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
              <circle cx="8" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {record.note && expanded && (
        <p className="text-xs text-gray-400 mt-1 ml-11">{record.note}</p>
      )}

      {expanded && (
        <div className="ml-11">
          <RecordActions
            record={record}
            categories={categories}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
          />
        </div>
      )}
    </div>
  )
}
