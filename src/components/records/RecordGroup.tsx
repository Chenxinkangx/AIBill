import type { RecordItem, Category } from '../../types'
import RecordCard from './RecordCard'

interface Props {
  date: string
  records: RecordItem[]
  getCategoryName: (id: string) => string
  categories: Category[]
  onUpdated: () => void
  onDeleted: () => void
}

export default function RecordGroup({
  date,
  records,
  getCategoryName,
  categories,
  onUpdated,
  onDeleted,
}: Props) {
  // Format display date
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = new Date(date + 'T00:00:00')
  const today = new Date()
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()

  let dateLabel: string
  if (isToday) dateLabel = '今天'
  else if (isYesterday) dateLabel = '昨天'
  else dateLabel = `${d.getMonth() + 1}月${d.getDate()}日`

  const totalExpense = records
    .filter((r) => r.type === 'expense')
    .reduce((s, r) => s + r.amount, 0)
  const totalIncome = records
    .filter((r) => r.type === 'income')
    .reduce((s, r) => s + r.amount, 0)

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{dateLabel}</span>
          <span className="text-xs text-gray-400">{weekDays[d.getDay()]}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {totalExpense > 0 && (
            <span className="text-gray-500">支出 ¥{totalExpense}</span>
          )}
          {totalIncome > 0 && (
            <span className="text-green-600">收入 ¥{totalIncome}</span>
          )}
        </div>
      </div>
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          categoryName={getCategoryName(record.categoryId)}
          categories={categories}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  )
}
