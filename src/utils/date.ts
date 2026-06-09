import dayjs from 'dayjs'

/**
 * 获取当月的 YYYY-MM 格式字符串
 */
export function getCurrentMonth(): string {
  return dayjs().format('YYYY-MM')
}

/**
 * 获取当前日期 YYYY-MM-DD
 */
export function getToday(): string {
  return dayjs().format('YYYY-MM-DD')
}

/**
 * 判断某个月份是否为当前月份
 */
export function isCurrentMonth(month: string): boolean {
  return month === getCurrentMonth()
}

/**
 * 获取某个月的总天数
 */
export function getDaysInMonth(month: string): number {
  return dayjs(month + '-01').daysInMonth()
}

/**
 * 获取包含今天在内的本月剩余天数
 * 例：6 月 9 日 → 30 - 9 + 1 = 22
 */
export function getRemainingDaysInCurrentMonth(today: string): number {
  const d = dayjs(today)
  const totalDays = d.daysInMonth()
  const currentDay = d.date()
  return totalDays - currentDay + 1
}

/**
 * 获取月份进度 0-1
 * 例：6 月 9 日 → 9 / 30 = 0.3
 */
export function getMonthProgress(today: string): number {
  const d = dayjs(today)
  return (d.date()) / d.daysInMonth()
}

/**
 * 计算指定月份的第一天和最后一天
 */
export function getMonthDateRange(month: string): { startDate: string; endDate: string } {
  const startDate = month + '-01'
  const lastDay = dayjs(startDate).daysInMonth()
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`
  return { startDate, endDate }
}
