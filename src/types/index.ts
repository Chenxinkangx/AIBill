// ========== 分类 ==========

export interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  order: number
  archived?: boolean
  system?: boolean
  budgetable: boolean
}

// ========== 月度总预算 ==========

export interface MonthlyBudget {
  id: string
  month: string // "2026-06"
  totalBudget: number
  monthlyIncome?: number
  createdAt: string
  updatedAt: string
}

// ========== 分类预算 ==========

export interface CategoryBudget {
  id: string
  categoryId: string
  month: string // "2026-06"
  amount: number
  createdAt: string
  updatedAt: string
}

// ========== 账单记录 ==========

export interface RecordItem {
  id: string
  title: string
  amount: number // 必须 > 0
  categoryId: string
  type: 'expense' | 'income'
  date: string // "2026-06-09"
  note?: string
  source: 'manual' | 'ai'
  createdAt: string
  updatedAt: string
}

// ========== AI 解析结果（未入库） ==========

export interface ParsedRecordItem {
  title: string
  amount: number
  categoryId?: string
  categoryName: string
  type: 'expense' | 'income'
  date: string
  confidence: number
  rawText?: string
}

// ========== 全局设置（存入 IndexedDB，参与 JSON 导出） ==========

export interface AppSettings {
  currency: 'CNY'
  defaultMonthBudget?: number
  aiProvider?: string
  aiModel?: string
}

// ========== 本地敏感设置（仅存 localStorage，不参与 JSON 导出） ==========

export interface LocalSecrets {
  aiApiKey?: string
}

// ========== 预算计算结果（只读） ==========

export interface BudgetSummary {
  month: string
  totalBudget: number
  totalExpense: number
  remaining: number
  isOverspent: boolean
  todaySuggested: number | null // 当前月份显示今日建议，历史月份为 null
  monthlySurplus?: number // 历史月份显示当月结余
}

export interface CategoryBudgetStatus {
  categoryId: string
  categoryName: string
  budget: number
  spent: number
  remaining: number
  usageRate: number // 0-1（展示时乘以 100）
  status: 'normal' | 'warning' | 'overspent'
}

// ========== JSON 导入导出格式（不含 API Key） ==========

export interface ExportData {
  app: 'AIBill'
  version: string // "1.0.0"
  exportedAt: string // ISO 时间戳
  data: {
    categories: Category[]
    monthlyBudgets: MonthlyBudget[]
    categoryBudgets: CategoryBudget[]
    records: RecordItem[]
    settings: AppSettings
  }
}
