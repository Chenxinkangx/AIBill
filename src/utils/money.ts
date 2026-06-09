/**
 * 格式化金额显示
 * 例：2360 → "2,360"
 */
export function formatMoney(amount: number, currency: string = 'CNY'): string {
  if (currency === 'CNY') {
    return `¥${Math.round(amount).toLocaleString('zh-CN')}`
  }
  return `$${amount.toLocaleString('en-US')}`
}

/**
 * 格式化百分比
 * 例：0.45 → "45%"
 */
export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`
}
