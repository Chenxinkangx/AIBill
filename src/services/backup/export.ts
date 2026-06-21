import { db } from '../../db/index'
import type { ExportData } from '../../types'

const APP_VERSION = '2.0.0'

/**
 * 导出全部数据为 ExportData 格式
 * 注意：不包含 API Key（存在 localStorage 中）
 */
export async function exportData(): Promise<ExportData> {
  const [budgetCategories, tags, monthlyBudgets, categoryBudgets, records, settings] =
    await Promise.all([
      db.categories.toArray(),
      db.tags.toArray(),
      db.monthlyBudgets.toArray(),
      db.categoryBudgets.toArray(),
      db.records.toArray(),
      db.settings.get('CNY'),
    ])

  return {
    app: 'AIBill',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      budgetCategories,
      tags,
      monthlyBudgets,
      categoryBudgets,
      records,
      settings: settings ?? { currency: 'CNY' },
    },
  }
}

/**
 * 导出数据并触发浏览器下载
 */
export async function downloadBackup(): Promise<void> {
  const data = await exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const filename = `AIBill-backup-${data.exportedAt.slice(0, 10)}.json`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
