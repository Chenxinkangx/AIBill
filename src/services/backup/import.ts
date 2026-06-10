import { db } from '../../db/index'
import type { ExportData } from '../../types'
import { isValidDateString, isValidMonthString } from '../../utils/validation'

export interface ImportResult {
  success: boolean
  message: string
  recordCount?: number
}

/**
 * 解析并校验 JSON 文件内容
 */
function parseJsonFile(content: string): ExportData | null {
  try {
    const parsed = JSON.parse(content)

    if (parsed.app !== 'AIBill') {
      return null
    }
    if (typeof parsed.version !== 'string') {
      return null
    }
    if (!parsed.data || typeof parsed.data !== 'object') {
      return null
    }
    if (
      !Array.isArray(parsed.data.categories) ||
      !Array.isArray(parsed.data.monthlyBudgets) ||
      !Array.isArray(parsed.data.categoryBudgets) ||
      !Array.isArray(parsed.data.records) ||
      !parsed.data.settings ||
      typeof parsed.data.settings !== 'object'
    ) {
      return null
    }

    const data = parsed as ExportData
    return validateExportData(data) ? null : data
  } catch {
    return null
  }
}

export function validateExportData(data: ExportData): string | null {
  const categories = data.data.categories
  const monthlyBudgets = data.data.monthlyBudgets
  const categoryBudgets = data.data.categoryBudgets
  const records = data.data.records
  const categoryIds = new Set<string>()

  for (const category of categories) {
    if (
      !category ||
      typeof category.id !== 'string' ||
      typeof category.name !== 'string' ||
      typeof category.order !== 'number' ||
      typeof category.budgetable !== 'boolean'
    ) {
      return '分类数据格式错误'
    }
    if (categoryIds.has(category.id)) return '分类数据重复'
    categoryIds.add(category.id)
  }

  const income = categories.find((category) => category.id === 'income')
  if (!income || income.budgetable || !income.system) {
    return '缺少系统收入分类'
  }

  const monthSet = new Set<string>()
  for (const budget of monthlyBudgets) {
    if (
      !budget ||
      typeof budget.id !== 'string' ||
      !isValidMonthString(budget.month) ||
      typeof budget.totalBudget !== 'number' ||
      budget.totalBudget < 0
    ) {
      return '月预算数据格式错误'
    }
    if (monthSet.has(budget.month)) return '月预算数据重复'
    monthSet.add(budget.month)
  }

  const categoryBudgetSet = new Set<string>()
  for (const budget of categoryBudgets) {
    if (
      !budget ||
      typeof budget.id !== 'string' ||
      typeof budget.categoryId !== 'string' ||
      !isValidMonthString(budget.month) ||
      typeof budget.amount !== 'number' ||
      budget.amount < 0 ||
      !categoryIds.has(budget.categoryId) ||
      budget.categoryId === 'income'
    ) {
      return '分类预算数据格式错误'
    }
    const key = `${budget.month}:${budget.categoryId}`
    if (categoryBudgetSet.has(key)) return '分类预算数据重复'
    categoryBudgetSet.add(key)
  }

  const recordIds = new Set<string>()
  for (const record of records) {
    if (
      !record ||
      typeof record.id !== 'string' ||
      typeof record.title !== 'string' ||
      typeof record.amount !== 'number' ||
      record.amount <= 0 ||
      !isValidDateString(record.date) ||
      (record.type !== 'expense' && record.type !== 'income') ||
      (record.source !== 'manual' && record.source !== 'ai') ||
      !categoryIds.has(record.categoryId)
    ) {
      return '账单数据格式错误'
    }
    if (record.type === 'income' && record.categoryId !== 'income') {
      return '收入账单分类错误'
    }
    if (record.type === 'expense' && record.categoryId === 'income') {
      return '支出账单分类错误'
    }
    if (recordIds.has(record.id)) return '账单数据重复'
    recordIds.add(record.id)
  }

  if (!data.data.settings || data.data.settings.currency !== 'CNY') {
    return '设置数据格式错误'
  }

  return null
}

/**
 * 导入 JSON 备份文件（全量覆盖）
 * 流程：校验 → 确认 → 清空 → 写入
 */
export async function importBackup(content: string): Promise<ImportResult> {
  const data = parseJsonFile(content)
  if (!data) {
    return {
      success: false,
      message: '文件格式错误，数据未变更',
    }
  }

  const recordCount = data.data.records.length

  try {
    await db.transaction(
      'rw',
      db.categories,
      db.monthlyBudgets,
      db.categoryBudgets,
      db.records,
      db.settings,
      async () => {
        await Promise.all([
          db.categories.clear(),
          db.monthlyBudgets.clear(),
          db.categoryBudgets.clear(),
          db.records.clear(),
          db.settings.clear(),
        ])

        await Promise.all([
          data.data.categories.length > 0
            ? db.categories.bulkAdd(data.data.categories)
            : Promise.resolve(),
          data.data.monthlyBudgets.length > 0
            ? db.monthlyBudgets.bulkAdd(data.data.monthlyBudgets)
            : Promise.resolve(),
          data.data.categoryBudgets.length > 0
            ? db.categoryBudgets.bulkAdd(data.data.categoryBudgets)
            : Promise.resolve(),
          data.data.records.length > 0
            ? db.records.bulkAdd(data.data.records)
            : Promise.resolve(),
          db.settings.put(data.data.settings),
        ])
      }
    )

    return {
      success: true,
      message: `已恢复 ${recordCount} 条账单`,
      recordCount,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '导入写入失败'
    return {
      success: false,
      message: `导入失败：${message}`,
    }
  }
}

/**
 * 从 File 对象读取内容并导入
 */
export async function importBackupFromFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      if (!content) {
        resolve({ success: false, message: '无法读取文件' })
        return
      }
      const result = await importBackup(content)
      resolve(result)
    }
    reader.onerror = () => {
      resolve({ success: false, message: '文件读取失败' })
    }
    reader.readAsText(file)
  })
}
