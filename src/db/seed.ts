import type { Category } from '../types'
import { db } from './index'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food',       name: '餐饮',     icon: '\u{1F37D}\u{FE0F}', order: 1,  budgetable: true,  archived: false },
  { id: 'cat-transport',  name: '交通',     icon: '\u{1F686}',          order: 2,  budgetable: true,  archived: false },
  { id: 'cat-study',      name: '学习',     icon: '\u{1F4DA}',          order: 3,  budgetable: true,  archived: false },
  { id: 'cat-entertain',  name: '娱乐',     icon: '\u{1F3AE}',          order: 4,  budgetable: true,  archived: false },
  { id: 'cat-fitness',    name: '健身',     icon: '\u{1F4AA}',          order: 5,  budgetable: true,  archived: false },
  { id: 'cat-daily',      name: '日用品',    icon: '\u{1F9F4}',          order: 6,  budgetable: true,  archived: false },
  { id: 'cat-social',     name: '恋爱/社交', icon: '\u{1F495}',          order: 7,  budgetable: true,  archived: false },
  { id: 'cat-other',      name: '其他',     icon: '\u{1F4E6}',          order: 8,  budgetable: true,  archived: false },
  // 系统内置收入分类
  { id: 'income',         name: '收入',     icon: '\u{1F4B0}',          order: -1, budgetable: false, system: true, archived: false },
]

/**
 * 检测数据是否为空，若为空则写入预置分类和默认设置
 * 返回 true 表示首次初始化完成
 */
export async function initializeIfNeeded(): Promise<boolean> {
  const categoryCount = await db.categories.count()
  if (categoryCount > 0) {
    return false // 已有数据，无需初始化
  }

  // 写入预置分类
  await db.categories.bulkAdd(DEFAULT_CATEGORIES)

  // 写入默认设置
  await db.settings.put({
    currency: 'CNY',
  })

  return true
}
