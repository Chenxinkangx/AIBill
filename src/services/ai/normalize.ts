import type { ParsedRecordItem, Category } from '../../types'
import { getToday } from '../../utils/date'

/**
 * 校验并规范化 AI 返回的解析结果
 */
export function normalizeParsedItems(
  raw: unknown[],
  categories: Category[]
): ParsedRecordItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return []

  const today = getToday()

  return raw
    .filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null
    )
    .map((item) => {
      // Ensure amount > 0
      const amount = Number(item.amount)
      if (isNaN(amount) || amount <= 0) return null

      // Ensure type
      const type = item.type === 'income' ? 'income' : 'expense'

      // Match category
      let categoryName = String(item.categoryName ?? '').trim()
      let categoryId: string | undefined

      if (type === 'income') {
        categoryName = '收入'
        categoryId = 'income'
      } else {
        const matched = categories.find(
          (c) => c.name === categoryName || c.id === categoryName
        )
        if (matched) {
          categoryId = matched.id
        } else {
          // Fallback to "其他"
          categoryName = '其他'
          const other = categories.find((c) => c.name === '其他')
          categoryId = other?.id ?? 'cat-other'
        }
      }

      // Validate date
      let date = String(item.date ?? '').trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        date = today
      }

      const confidence = typeof item.confidence === 'number' ? item.confidence : 0.5

      return {
        title: String(item.title ?? '').trim() || '未命名',
        amount,
        categoryId,
        categoryName,
        type,
        date,
        confidence: Math.max(0, Math.min(1, confidence)),
        rawText: String(item.rawText ?? ''),
      } as ParsedRecordItem
    })
    .filter((item): item is ParsedRecordItem => item !== null)
}
