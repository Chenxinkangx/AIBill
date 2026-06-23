import { useEffect, useState, useCallback } from 'react'
import { db } from '@/db/index'
import { useAppStore } from '@/stores/appStore'
import { getBudgetAllocationDiff, getCategoryBudgetStatuses } from '@/services/budget/calculator'
import { getRecordsByMonth } from '@/services/record/recordService'
import { getToday } from '@/utils/date'
import { formatMoney, sumMoney } from '@/utils/money'
import type { BudgetCategory, MonthlyBudget, CategoryBudget, RecordItem } from '@/types'
import MonthPicker from '@/components/common/MonthPicker'
import TotalBudgetInput from '@/components/budget/TotalBudgetInput'
import CategoryBudgetRow from '@/components/budget/CategoryBudgetRow'
import { generateId } from '@/utils/id'
import {
  createCategory,
  archiveCategory,
  renameCategory,
  restoreCategory,
} from '@/services/category/categoryService'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Toast from '@/components/common/Toast'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function BudgetPage() {
  const currentMonth = useAppStore((s) => s.currentMonth)

  const [loading, setLoading] = useState(true)
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget | null>(null)
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [archivedCategories, setArchivedCategories] = useState<BudgetCategory[]>([])
  const [records, setRecords] = useState<RecordItem[]>([])
  const [saving, setSaving] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [archiveTarget, setArchiveTarget] = useState<BudgetCategory | null>(null)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const { toast, showToast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [mb, cbs, cats, recs] = await Promise.all([
        db.monthlyBudgets.get({ month: currentMonth }),
        db.categoryBudgets.where({ month: currentMonth }).toArray(),
        db.categories.toArray(),
        getRecordsByMonth(currentMonth),
      ])
      setMonthlyBudget(mb ?? null)
      setCategoryBudgets(cbs)
      setCategories(cats.filter((c) => c.budgetable && !c.archived).sort((a, b) => a.order - b.order))
      setArchivedCategories(cats.filter((c) => c.budgetable && c.archived).sort((a, b) => a.order - b.order))
      setRecords(recs)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  const allocationDiff = monthlyBudget
    ? getBudgetAllocationDiff(monthlyBudget.totalBudget, categoryBudgets)
    : null

  const handleTotalBudgetChange = async (value: number) => {
    const nextValue = Math.max(0, value || 0)
    setSaving(true)
    try {
      const now = new Date().toISOString()
      if (monthlyBudget) {
        await db.monthlyBudgets.update(monthlyBudget.id, {
          totalBudget: nextValue,
          updatedAt: now,
        })
        setMonthlyBudget({ ...monthlyBudget, totalBudget: nextValue, updatedAt: now })
      } else {
        const newBudget: MonthlyBudget = {
          id: generateId(),
          month: currentMonth,
          totalBudget: nextValue,
          createdAt: now,
          updatedAt: now,
        }
        await db.monthlyBudgets.add(newBudget)
        setMonthlyBudget(newBudget)
      }
    } catch {
      showToast('error', '预算保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryBudgetChange = async (categoryId: string, amount: number) => {
    const nextAmount = Math.max(0, amount || 0)
    try {
      const now = new Date().toISOString()
      const existing = categoryBudgets.find((cb) => cb.budgetCategoryId === categoryId)

      if (existing) {
        await db.categoryBudgets.update(existing.id, { amount: nextAmount, updatedAt: now })
        setCategoryBudgets((prev) =>
          prev.map((cb) => (cb.id === existing.id ? { ...cb, amount: nextAmount, updatedAt: now } : cb))
        )
      } else {
        const newCB: CategoryBudget = {
          id: generateId(),
          budgetCategoryId: categoryId,
          month: currentMonth,
          amount: nextAmount,
          createdAt: now,
          updatedAt: now,
        }
        await db.categoryBudgets.add(newCB)
        setCategoryBudgets((prev) => [...prev, newCB])
      }
    } catch {
      showToast('error', '分类预算保存失败，请重试')
    }
  }

  const handleCreateCategory = async () => {
    try {
      const category = await createCategory(newCategoryName)
      setCategories((prev) => [...prev, category].sort((a, b) => a.order - b.order))
      setNewCategoryName('')
      showToast('success', '预算分类已添加')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '添加分类失败')
    }
  }

  const handleArchiveCategory = async () => {
    if (!archiveTarget) return
    try {
      await archiveCategory(archiveTarget.id)
      setCategories((prev) => prev.filter((cat) => cat.id !== archiveTarget.id))
      setArchivedCategories((prev) =>
        [...prev, { ...archiveTarget, archived: true }].sort((a, b) => a.order - b.order)
      )
      setArchiveTarget(null)
      showToast('success', '预算分类已归档')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '归档失败')
    }
  }

  const startRenameCategory = (category: BudgetCategory) => {
    setEditingCategory(category)
    setEditingCategoryName(category.name)
  }

  const handleRenameCategory = async () => {
    if (!editingCategory) return
    try {
      await renameCategory(editingCategory.id, editingCategoryName)
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategory.id ? { ...cat, name: editingCategoryName.trim() } : cat
        )
      )
      setEditingCategory(null)
      setEditingCategoryName('')
      showToast('success', '预算分类已更新')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '更新分类失败')
    }
  }

  const handleRestoreCategory = async (category: BudgetCategory) => {
    try {
      await restoreCategory(category.id)
      setArchivedCategories((prev) => prev.filter((cat) => cat.id !== category.id))
      setCategories((prev) =>
        [...prev, { ...category, archived: false }].sort((a, b) => a.order - b.order)
      )
      showToast('success', '预算分类已恢复')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '恢复分类失败')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <MonthPicker />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  const totalAllocated = categoryBudgets.reduce((sum, cb) => sum + cb.amount, 0)
  const totalIncome = sumMoney(records.filter((record) => record.type === 'income').map((record) => record.amount))
  const categoryStatuses = getCategoryBudgetStatuses(
    categories,
    categoryBudgets,
    records,
    currentMonth,
    getToday()
  )

  return (
    <div className="space-y-4">
      <MonthPicker />

      {/* Total Budget */}
      <TotalBudgetInput
        totalBudget={monthlyBudget?.totalBudget ?? 0}
        onChange={handleTotalBudgetChange}
      />

      {/* Allocation Diff */}
      {monthlyBudget && monthlyBudget.totalBudget > 0 && (
        <Card className="rounded-xl px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">分类预算合计</span>
            <span className="font-medium">{formatMoney(totalAllocated)}</span>
          </div>
          {allocationDiff && (
            <div className="flex items-center justify-between text-sm mt-1">
              {allocationDiff.type === 'unallocated' && (
                <>
                  <span className="text-budget-green">未分配预算</span>
                  <span className="text-budget-green font-medium">
                    +{formatMoney(allocationDiff.diff)}
                  </span>
                </>
              )}
              {allocationDiff.type === 'exact' && (
                <span className="text-muted-foreground col-span-2">预算已全部分配</span>
              )}
              {allocationDiff.type === 'overspent' && (
                <>
                  <span className="text-budget-red">已超出总预算</span>
                  <span className="text-budget-red font-medium">
                    -{formatMoney(allocationDiff.diff)}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">本月收入</span>
            <span className="text-budget-green font-medium">{formatMoney(totalIncome)}</span>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!monthlyBudget && (
        <div className="text-center py-10 text-muted-foreground space-y-2">
          <p>设置本月总预算后，即可分配分类预算</p>
        </div>
      )}

      {/* Category Budgets */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground px-1">分类预算</h2>
        {categories.map((cat) => {
          const cb = categoryBudgets.find((b) => b.budgetCategoryId === cat.id)
          const status = categoryStatuses.find((s) => s.budgetCategoryId === cat.id)
          const budget = cb?.amount ?? 0
          return (
            <CategoryBudgetRow
              key={cat.id}
              name={cat.name}
              icon={cat.icon}
              budget={budget}
              spent={status?.spent ?? 0}
              usageRate={status?.usageRate ?? 0}
              status={status?.status ?? 'normal'}
              onBudgetChange={(value) => handleCategoryBudgetChange(cat.id, value)}
              onRename={() => startRenameCategory(cat)}
              onArchive={() => setArchiveTarget(cat)}
            />
          )
        })}
        <Card className="rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-foreground">添加预算分类</h3>
          <div className="flex gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="预算分类名称"
              className="flex-1 h-10 rounded-lg"
            />
            <Button type="button" onClick={handleCreateCategory} className="h-10 rounded-lg px-4">
              添加
            </Button>
          </div>
        </Card>
      </div>

      {archivedCategories.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-1">已归档预算分类</h2>
          <Card className="rounded-xl divide-y divide-border">
            {archivedCategories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon || '📦'}</span>
                  <span className="text-sm font-medium text-muted-foreground">{cat.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestoreCategory(cat)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  恢复
                </button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full">
          保存中...
        </div>
      )}
      <ConfirmDialog
        open={archiveTarget !== null}
        title="归档分类"
        message="归档后不会在新账单中显示，历史账单仍会保留该分类名称。确定归档吗？"
        confirmLabel="归档"
        destructive
        onConfirm={handleArchiveCategory}
        onCancel={() => setArchiveTarget(null)}
      />
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-sm p-6 space-y-4 rounded-2xl">
            <h3 className="text-lg font-semibold text-foreground">编辑分类</h3>
            <Input
              value={editingCategoryName}
              onChange={(e) => setEditingCategoryName(e.target.value)}
              autoFocus
              className="w-full h-10 rounded-lg"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCategory(null)
                  setEditingCategoryName('')
                }}
                className="flex-1 h-10 rounded-xl"
              >
                取消
              </Button>
              <Button
                onClick={handleRenameCategory}
                className="flex-1 h-10 rounded-xl"
              >
                保存
              </Button>
            </div>
          </Card>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  )
}
