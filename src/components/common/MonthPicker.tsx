import { useCurrentMonth } from '../../hooks/useCurrentMonth'

export default function MonthPicker() {
  const { currentMonth, goToPrevMonth, goToNextMonth, isCurrent } = useCurrentMonth()

  const displayMonth = `${currentMonth.slice(0, 4)}年${currentMonth.slice(5, 7)}月`

  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
      <button
        onClick={goToPrevMonth}
        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800"
        aria-label="上个月"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-800">{displayMonth}</span>
        {isCurrent && (
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">本月</span>
        )}
      </div>

      <button
        onClick={goToNextMonth}
        disabled={isCurrent}
        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="下个月"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
