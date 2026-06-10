import { db } from '../../db/index'
import type { Category } from '../../types'
import { generateId } from '../../utils/id'

export async function createCategory(name: string): Promise<Category> {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('请填写分类名称')
  }

  const existing = await db.categories
    .filter((category) => category.name === trimmed && !category.archived)
    .first()
  if (existing) {
    throw new Error('分类已存在')
  }

  const categories = await db.categories.toArray()
  const maxOrder = categories.reduce((max, category) => Math.max(max, category.order), 0)
  const category: Category = {
    id: generateId(),
    name: trimmed,
    order: maxOrder + 1,
    budgetable: true,
    archived: false,
  }

  await db.categories.add(category)
  return category
}

export async function archiveCategory(categoryId: string): Promise<void> {
  const category = await db.categories.get(categoryId)
  if (!category) {
    throw new Error('分类不存在')
  }
  if (category.system || category.id === 'income') {
    throw new Error('系统分类不能归档')
  }
  await db.categories.update(categoryId, { archived: true })
}
