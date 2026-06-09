/**
 * 精确加法（避免浮点数精度问题）
 */
export function addMoney(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100
}

/**
 * 精确求和
 */
export function sumMoney(values: number[]): number {
  return values.reduce((sum, val) => addMoney(sum, val), 0)
}

/**
 * 格式化金额显示
 * 例：2360 → "2,360"
 */
export function formatMoney(amount: number, currency: string = 'CNY'): string {
  const rounded = Math.round(amount * 100) / 100
  if (currency === 'CNY') {
    return `¥${rounded.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `$${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * 格式化百分比
 * 例：0.45 → "45.0%"，0.985 → "98.5%"
 */
export function formatPercent(rate: number): string {
  return `${(Math.round(rate * 1000) / 10).toFixed(1)}%`
}
