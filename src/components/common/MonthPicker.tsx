import { Card } from '@/components/ui/card'
import { useCurrentMonth } from '@/hooks/useCurrentMonth'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function MonthPicker() {
  const { currentMonth, goToPrevMonth, goToNextMonth, isCurrent } = useCurrentMonth()

  const displayMonth = `${currentMonth.slice(0, 4)}年${currentMonth.slice(5, 7)}月`

  return (
    <Card className="flex flex-row items-center justify-between px-4 py-3 rounded-xl">
      <button
        onClick={goToPrevMonth}
        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label="上个月"
      >
        <ChevronLeft className="size-5" />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-foreground">{displayMonth}</span>
        {isCurrent && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">本月</span>
        )}
      </div>

      <button
        onClick={goToNextMonth}
        disabled={isCurrent}
        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="下个月"
      >
        <ChevronRight className="size-5" />
      </button>
    </Card>
  )
}
