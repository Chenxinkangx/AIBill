import { useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { getCurrentMonth } from '../utils/date'

/**
 * 管理当前选中的月份
 * 初始化时自动设为当前月份
 */
export function useCurrentMonth() {
  const currentMonth = useAppStore((s) => s.currentMonth)
  const setCurrentMonth = useAppStore((s) => s.setCurrentMonth)

  const goToPrevMonth = useCallback(() => {
    const [year, month] = currentMonth.split('-').map(Number)
    const d = new Date(year, month - 2, 1) // month-2 because JS months are 0-indexed
    const prev = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setCurrentMonth(prev)
  }, [currentMonth, setCurrentMonth])

  const goToNextMonth = useCallback(() => {
    const [year, month] = currentMonth.split('-').map(Number)
    const d = new Date(year, month, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setCurrentMonth(next)
  }, [currentMonth, setCurrentMonth])

  const goToMonth = useCallback(
    (month: string) => {
      setCurrentMonth(month)
    },
    [setCurrentMonth]
  )

  const isCurrent = currentMonth === getCurrentMonth()

  return {
    currentMonth,
    setCurrentMonth: goToMonth,
    goToPrevMonth,
    goToNextMonth,
    isCurrent,
  }
}
