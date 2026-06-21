import Dexie, { type EntityTable } from 'dexie'
import type { BudgetCategory, MonthlyBudget, CategoryBudget, RecordItem, AppSettings, Tag } from '../types'

export class AIBillDatabase extends Dexie {
  categories!: EntityTable<BudgetCategory, 'id'>
  monthlyBudgets!: EntityTable<MonthlyBudget, 'id'>
  categoryBudgets!: EntityTable<CategoryBudget, 'id'>
  records!: EntityTable<RecordItem, 'id'>
  tags!: EntityTable<Tag, 'id'>
  settings!: EntityTable<AppSettings, 'currency'>

  constructor() {
    super('AIBill')

    this.version(1).stores({
      categories: 'id, name, budgetable, archived, order',
      monthlyBudgets: 'id, &month',
      categoryBudgets: 'id, &[month+categoryId], month, categoryId',
      records: 'id, date, categoryId, type, source, [categoryId+date], [type+date]',
      settings: 'currency',
    })

    this.version(2)
      .stores({
        categories: 'id, name, budgetable, archived, order',
        monthlyBudgets: 'id, &month',
        categoryBudgets: 'id, &[month+budgetCategoryId], month, budgetCategoryId',
        records: 'id, date, budgetCategoryId, type, source, *tagIds, [budgetCategoryId+date], [type+date]',
        tags: 'id, name, archived, order',
        settings: 'currency',
      })
      .upgrade(async (tx) => {
        await tx.table('categoryBudgets').toCollection().modify((budget) => {
          budget.budgetCategoryId = budget.budgetCategoryId ?? budget.categoryId
          delete budget.categoryId
        })
        await tx.table('records').toCollection().modify((record) => {
          record.budgetCategoryId = record.budgetCategoryId ?? record.categoryId
          record.tagIds = Array.isArray(record.tagIds) ? record.tagIds : []
          delete record.categoryId
        })
      })
  }
}

export const db = new AIBillDatabase()
