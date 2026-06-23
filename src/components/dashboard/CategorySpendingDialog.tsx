import type { CategoryBudgetStatus, RecordItem } from '@/types'
import { formatMoney } from '@/utils/money'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  category: CategoryBudgetStatus | null
  records: RecordItem[]
  month: string
  onClose: () => void
}

export default function CategorySpendingDialog({ category, records, month, onClose }: Props) {
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
    <Dialog open={!!category} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm overflow-hidden rounded-2xl p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <DialogTitle className="text-lg font-semibold">
              {category.categoryName}
            </DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatMonth(month)}支出明细</p>
          </div>
          <DialogClose
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xl leading-none text-muted-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ×
          </DialogClose>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 bg-muted/50 px-4 py-3 text-center">
          <SummaryItem label="已花" value={formatMoney(category.spent)} />
          <SummaryItem label="预算" value={formatMoney(category.budget)} />
          <SummaryItem
            label={overspentAmount > 0 ? '超支' : '剩余'}
            value={formatMoney(overspentAmount > 0 ? overspentAmount : category.remaining)}
            danger={overspentAmount > 0}
          />
        </div>

        <div className="min-h-0 max-h-[60vh] overflow-y-auto overscroll-contain px-4 py-2">
          {categoryRecords.length > 0 ? (
            <div className="divide-y divide-border">
              {categoryRecords.map((record) => (
                <div key={record.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{record.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatRecordDate(record.date)}</p>
                    {record.note && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{record.note}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    -{formatMoney(record.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">这个月还没有相关支出</p>
              <p className="mt-1 text-xs text-muted-foreground">记账后会显示在这里</p>
            </div>
          )}
        </div>

        <DialogFooter className="m-0 rounded-b-2xl border-t border-border bg-background px-4 py-3">
          <DialogClose asChild onClick={onClose}>
            <Button className="w-full h-10 rounded-xl text-sm font-medium">
              关闭明细
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SummaryItem({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 truncate text-xs font-semibold tabular-nums ${danger ? 'text-destructive' : 'text-foreground'}`}>
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
