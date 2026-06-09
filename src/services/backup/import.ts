import { db } from '../../db/index'
import type { ExportData } from '../../types'

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

    // Validate structure
    if (parsed.app !== 'AIBill') {
      return null
    }
    if (!parsed.version) {
      return null
    }
    if (!parsed.data) {
      return null
    }

    return parsed as ExportData
  } catch {
    return null
  }
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

  // Count records for confirmation
  const recordCount = data.data.records.length

  try {
    // Clear all tables
    await Promise.all([
      db.categories.clear(),
      db.monthlyBudgets.clear(),
      db.categoryBudgets.clear(),
      db.records.clear(),
    ])

    // Write imported data
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
    ])

    // Restore settings if present
    if (data.data.settings) {
      await db.settings.put(data.data.settings)
    }

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
