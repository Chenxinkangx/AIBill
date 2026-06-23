import type { RecordItem, BudgetCategory, Tag } from '@/types'
import RecordCard from '@/components/records/RecordCard'
import { sumMoney } from '@/utils/money'
import MoneyText from '@/components/common/MoneyText'

interface Props {
  date: string
  records: RecordItem[]
  getCategoryName: (id: string) => string
  categories: BudgetCategory[]
  tags: Tag[]
  onUpdated: () => void
  onDeleted: () => void
}

export default function RecordGroup({
  date,
  records,
  getCategoryName,
  categories,
  tags,
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

  const totalExpense = sumMoney(
    records.filter((r) => r.type === 'expense').map((r) => r.amount)
  )
  const totalIncome = sumMoney(
    records.filter((r) => r.type === 'income').map((r) => r.amount)
  )

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm md:shadow-none">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{dateLabel}</span>
          <span className="text-xs text-muted-foreground">{weekDays[d.getDay()]}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {totalExpense > 0 && (
            <MoneyText amount={totalExpense} type="expense" size="sm" />
          )}
          {totalIncome > 0 && (
            <MoneyText amount={totalIncome} type="income" size="sm" showSign />
          )}
        </div>
      </div>
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          categoryName={getCategoryName(record.budgetCategoryId)}
          categories={categories}
          tags={tags}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  )
}
