import type { BudgetCategory, RecordItem, Tag } from '@/types'
import { formatMoney } from '@/utils/money'

interface Props {
  records: RecordItem[]
  categories: BudgetCategory[]
  tags: Tag[]
  onViewAll: () => void
}

const MAX_VISIBLE_RECORDS = 5

export default function RecentlyAddedList({ records, categories, tags, onViewAll }: Props) {
  if (records.length === 0) return null

  const visibleRecords = records.slice(0, MAX_VISIBLE_RECORDS)
  const hiddenCount = records.length - visibleRecords.length

  return (
    <section className="space-y-2" aria-labelledby="recently-added-title">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 id="recently-added-title" className="text-sm font-medium text-foreground">
            刚刚添加
          </h2>
          <span className="rounded-full bg-budget-green/10 px-2 py-0.5 text-[11px] font-medium text-budget-green">
            {records.length} 条
          </span>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium text-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          查看全部账单
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-card">
        <div className="divide-y divide-border">
          {visibleRecords.map((record) => {
            const categoryName = record.type === 'income'
              ? '收入'
              : categories.find((category) => category.id === record.budgetCategoryId)?.name ?? '已归档分类'
            const recordTags = record.tagIds
              .map((id) => tags.find((tag) => tag.id === id))
              .filter((tag): tag is Tag => Boolean(tag))

            return (
              <div key={record.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{record.title}</p>
                    <span className="shrink-0 text-[10px] font-medium text-budget-green">已保存</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {categoryName} · {formatRecordDate(record.date)}
                  </p>
                  {recordTags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {recordTags.map((tag) => (
                        <span key={tag.id} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`shrink-0 text-sm font-semibold tabular-nums ${record.type === 'income' ? 'text-budget-green' : 'text-foreground'}`}>
                  {record.type === 'income' ? '+' : '-'}{formatMoney(record.amount)}
                </span>
              </div>
            )
          })}
        </div>

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={onViewAll}
            className="w-full border-t border-border px-4 py-2.5 text-center text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            另有 {hiddenCount} 条，查看全部账单
          </button>
        )}
      </div>
    </section>
  )
}

function formatRecordDate(date: string): string {
  const [, month, day] = date.split('-')
  return `${Number(month)}月${Number(day)}日`
}
