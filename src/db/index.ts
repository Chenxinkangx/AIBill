import Dexie, { type EntityTable } from 'dexie'
import type { Category, MonthlyBudget, CategoryBudget, RecordItem, AppSettings } from '../types'

export class AIBillDatabase extends Dexie {
  categories!: EntityTable<Category, 'id'>
  monthlyBudgets!: EntityTable<MonthlyBudget, 'id'>
  categoryBudgets!: EntityTable<CategoryBudget, 'id'>
  records!: EntityTable<RecordItem, 'id'>
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
  }
}

export const db = new AIBillDatabase()
