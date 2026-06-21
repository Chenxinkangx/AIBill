import { create } from 'zustand'
import type { MonthlyBudget, CategoryBudget } from '../types'
import { db } from '../db/index'
import { generateId } from '../utils/id'

interface BudgetState {
  monthlyBudgets: MonthlyBudget[]
  categoryBudgets: CategoryBudget[]
  loading: boolean

  loadMonthlyBudget: (month: string) => Promise<MonthlyBudget | null>
  loadCategoryBudgets: (month: string) => Promise<CategoryBudget[]>
  loadAll: (month: string) => Promise<void>

  saveMonthlyBudget: (month: string, totalBudget: number, income?: number) => Promise<void>
  saveCategoryBudget: (categoryId: string, month: string, amount: number) => Promise<void>
}

export const useBudgetStore = create<BudgetState>((set) => ({
  monthlyBudgets: [],
  categoryBudgets: [],
  loading: false,

  loadMonthlyBudget: async (month: string) => {
    return (await db.monthlyBudgets.get({ month })) ?? null
  },

  loadCategoryBudgets: async (month: string) => {
    return db.categoryBudgets.where({ month }).toArray()
  },

  loadAll: async (month: string) => {
    set({ loading: true })
    const monthlyBudgets = await db.monthlyBudgets.where({ month }).toArray()
    const categoryBudgets = await db.categoryBudgets.where({ month }).toArray()
    set({ monthlyBudgets, categoryBudgets, loading: false })
  },

  saveMonthlyBudget: async (month: string, totalBudget: number, income?: number) => {
    const now = new Date().toISOString()
    const existing = await db.monthlyBudgets.get({ month })

    if (existing) {
      await db.monthlyBudgets.update(existing.id, {
        totalBudget,
        monthlyIncome: income ?? existing.monthlyIncome,
        updatedAt: now,
      })
    } else {
      await db.monthlyBudgets.add({
        id: generateId(),
        month,
        totalBudget,
        monthlyIncome: income,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Reload
    const monthlyBudgets = await db.monthlyBudgets.where({ month }).toArray()
    set({ monthlyBudgets })
  },

  saveCategoryBudget: async (categoryId: string, month: string, amount: number) => {
    const now = new Date().toISOString()
    const existing = await db.categoryBudgets
      .where({ month, budgetCategoryId: categoryId })
      .first()

    if (existing) {
      await db.categoryBudgets.update(existing.id, { amount, updatedAt: now })
    } else {
      await db.categoryBudgets.add({
        id: generateId(),
        budgetCategoryId: categoryId,
        month,
        amount,
        createdAt: now,
        updatedAt: now,
      })
    }

    const categoryBudgets = await db.categoryBudgets.where({ month }).toArray()
    set({ categoryBudgets })
  },
}))
