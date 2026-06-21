import { db } from '../../db/index'
import type { BudgetCategory, ExportData, Tag } from '../../types'
import { isValidDateString, isValidMonthString } from '../../utils/validation'

export interface ImportResult {
  success: boolean
  message: string
  recordCount?: number
}

interface ParseResult {
  data: ExportData | null
  error: string | null
}

function normalizeCategories(categories: BudgetCategory[]): BudgetCategory[] {
  return categories.map((category) =>
    category.id === 'income'
      ? { ...category, name: category.name || '收入', budgetable: false, system: true }
      : category
  )
}

function normalizeBackup(parsed: Record<string, unknown>): ExportData | null {
  if (parsed.app !== 'AIBill' || typeof parsed.version !== 'string') return null
  const rawData = parsed.data
  if (!rawData || typeof rawData !== 'object') return null
  const data = rawData as Record<string, unknown>
  const rawCategories = data.budgetCategories ?? data.categories

  if (
    !Array.isArray(rawCategories) ||
    !Array.isArray(data.monthlyBudgets) ||
    !Array.isArray(data.categoryBudgets) ||
    !Array.isArray(data.records) ||
    !data.settings ||
    typeof data.settings !== 'object'
  ) return null

  return {
    app: 'AIBill',
    version: parsed.version,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    data: {
      budgetCategories: normalizeCategories(rawCategories as BudgetCategory[]),
      tags: Array.isArray(data.tags) ? data.tags as Tag[] : [],
      monthlyBudgets: data.monthlyBudgets as ExportData['data']['monthlyBudgets'],
      categoryBudgets: data.categoryBudgets.map((budget) => {
        const item = budget as Record<string, unknown>
        return {
          ...item,
          budgetCategoryId: item.budgetCategoryId ?? item.categoryId,
        }
      }) as ExportData['data']['categoryBudgets'],
      records: data.records.map((record) => {
        const item = record as Record<string, unknown>
        return {
          ...item,
          budgetCategoryId: item.budgetCategoryId ?? item.categoryId,
          tagIds: Array.isArray(item.tagIds) ? item.tagIds : [],
        }
      }) as ExportData['data']['records'],
      settings: data.settings as ExportData['data']['settings'],
    },
  }
}

function parseJsonFile(content: string): ParseResult {
  try {
    const parsed = JSON.parse(content) as unknown
    if (!parsed || typeof parsed !== 'object') return { data: null, error: '备份数据格式错误' }
    const data = normalizeBackup(parsed as Record<string, unknown>)
    if (!data) return { data: null, error: '不是有效的 AIBill 备份文件' }
    const error = validateExportData(data)
    return error ? { data: null, error } : { data, error: null }
  } catch {
    return { data: null, error: 'JSON 文件无法解析' }
  }
}

export function validateExportData(data: ExportData): string | null {
  const categories = data.data.budgetCategories
  const tags = data.data.tags
  const categoryIds = new Set<string>()
  const tagIds = new Set<string>()

  for (const category of categories) {
    if (!category || typeof category.id !== 'string' || typeof category.name !== 'string' ||
      typeof category.order !== 'number' || typeof category.budgetable !== 'boolean') {
      return '预算分类数据格式错误'
    }
    if (categoryIds.has(category.id)) return '预算分类数据重复'
    categoryIds.add(category.id)
  }

  const income = categories.find((category) => category.id === 'income')
  if (!income || income.budgetable || income.system !== true) return '缺少系统收入分类'

  for (const tag of tags) {
    if (!tag || typeof tag.id !== 'string' || typeof tag.name !== 'string' ||
      typeof tag.order !== 'number' || typeof tag.createdAt !== 'string' || typeof tag.updatedAt !== 'string') {
      return '标签数据格式错误'
    }
    if (tagIds.has(tag.id)) return '标签数据重复'
    tagIds.add(tag.id)
  }

  const months = new Set<string>()
  for (const budget of data.data.monthlyBudgets) {
    if (!budget || typeof budget.id !== 'string' || !isValidMonthString(budget.month) ||
      typeof budget.totalBudget !== 'number' || budget.totalBudget < 0) return '月预算数据格式错误'
    if (months.has(budget.month)) return '月预算数据重复'
    months.add(budget.month)
  }

  const categoryBudgetKeys = new Set<string>()
  for (const budget of data.data.categoryBudgets) {
    if (!budget || typeof budget.id !== 'string' || typeof budget.budgetCategoryId !== 'string' ||
      !isValidMonthString(budget.month) || typeof budget.amount !== 'number' || budget.amount < 0 ||
      !categoryIds.has(budget.budgetCategoryId) || budget.budgetCategoryId === 'income') {
      return '分类预算数据格式错误'
    }
    const key = `${budget.month}:${budget.budgetCategoryId}`
    if (categoryBudgetKeys.has(key)) return '分类预算数据重复'
    categoryBudgetKeys.add(key)
  }

  const recordIds = new Set<string>()
  for (const record of data.data.records) {
    if (!record || typeof record.id !== 'string' || typeof record.title !== 'string' ||
      typeof record.amount !== 'number' || record.amount <= 0 || !isValidDateString(record.date) ||
      (record.type !== 'expense' && record.type !== 'income') ||
      (record.source !== 'manual' && record.source !== 'ai') ||
      !categoryIds.has(record.budgetCategoryId) || !Array.isArray(record.tagIds) ||
      record.tagIds.some((id) => typeof id !== 'string' || !tagIds.has(id))) {
      return '账单数据格式错误'
    }
    if (record.type === 'income' && record.budgetCategoryId !== 'income') return '收入账单分类错误'
    if (record.type === 'expense' && record.budgetCategoryId === 'income') return '支出账单分类错误'
    if (recordIds.has(record.id)) return '账单数据重复'
    recordIds.add(record.id)
  }

  if (data.data.settings.currency !== 'CNY') return '设置数据格式错误'
  return null
}

export async function importBackup(content: string): Promise<ImportResult> {
  const { data, error } = parseJsonFile(content)
  if (!data) return { success: false, message: `${error ?? '文件格式错误'}，数据未变更` }

  try {
    await db.transaction(
      'rw',
      [db.categories, db.tags, db.monthlyBudgets, db.categoryBudgets, db.records, db.settings],
      async () => {
        await Promise.all([
          db.categories.clear(), db.tags.clear(), db.monthlyBudgets.clear(),
          db.categoryBudgets.clear(), db.records.clear(), db.settings.clear(),
        ])
        await Promise.all([
          data.data.budgetCategories.length ? db.categories.bulkAdd(data.data.budgetCategories) : Promise.resolve(),
          data.data.tags.length ? db.tags.bulkAdd(data.data.tags) : Promise.resolve(),
          data.data.monthlyBudgets.length ? db.monthlyBudgets.bulkAdd(data.data.monthlyBudgets) : Promise.resolve(),
          data.data.categoryBudgets.length ? db.categoryBudgets.bulkAdd(data.data.categoryBudgets) : Promise.resolve(),
          data.data.records.length ? db.records.bulkAdd(data.data.records) : Promise.resolve(),
          db.settings.put(data.data.settings),
        ])
      }
    )
    return { success: true, message: `已恢复 ${data.data.records.length} 条账单`, recordCount: data.data.records.length }
  } catch (error) {
    return { success: false, message: `导入失败：${error instanceof Error ? error.message : '写入失败'}` }
  }
}

export async function importBackupFromFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result
      resolve(typeof content === 'string' ? await importBackup(content) : { success: false, message: '无法读取文件' })
    }
    reader.onerror = () => resolve({ success: false, message: '文件读取失败' })
    reader.readAsText(file)
  })
}
