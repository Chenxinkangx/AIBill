import type { ParsedRecordItem, BudgetCategory, Tag } from '../../types'
import { getToday } from '../../utils/date'
import { isValidDateString } from '../../utils/validation'
import { normalizeTagNames } from '../tag/tagRules'

/**
 * 校验并规范化 AI 返回的解析结果
 */
export function normalizeParsedItems(
  raw: unknown[],
  categories: BudgetCategory[],
  tags: Tag[] = []
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
      let budgetCategoryName = String(item.budgetCategoryName ?? item.categoryName ?? '').trim()
      let budgetCategoryId: string | undefined

      if (type === 'income') {
        budgetCategoryName = '收入'
        budgetCategoryId = 'income'
      } else {
        const matched = categories.find(
          (c) => c.name === budgetCategoryName || c.id === budgetCategoryName
        )
        if (matched) {
          budgetCategoryId = matched.id
        } else {
          // Fallback to "其他"
          budgetCategoryName = '其他'
          const other = categories.find((c) => c.name === '其他')
          budgetCategoryId = other?.id ?? 'cat-other'
        }
      }

      // Validate date
      let date = String(item.date ?? '').trim()
      if (!isValidDateString(date)) {
        date = today
      }

      const confidence = typeof item.confidence === 'number' ? item.confidence : 0.5
      const requestedTagNames = Array.isArray(item.tagNames) ? item.tagNames : []
      const existingNames = new Map(
        tags.filter((tag) => !tag.archived).map((tag) => [tag.name.toLocaleLowerCase(), tag.name])
      )
      const tagNames = normalizeTagNames(requestedTagNames).map(
        (name) => existingNames.get(name.toLocaleLowerCase()) ?? name
      )

      return {
        title: String(item.title ?? '').trim() || '未命名',
        amount,
        budgetCategoryId,
        budgetCategoryName,
        tagNames,
        type,
        date,
        confidence: Math.max(0, Math.min(1, confidence)),
        rawText: String(item.rawText ?? ''),
      } as ParsedRecordItem
    })
    .filter((item): item is ParsedRecordItem => item !== null)
}
