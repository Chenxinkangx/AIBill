import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { manualRecordSchema, type ManualRecordFormValues } from '@/services/record/validation'
import type { BudgetCategory, Tag } from '@/types'
import { getToday } from '@/utils/date'
import TagSelector from '@/components/common/TagSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  categories: BudgetCategory[]
  tags: Tag[]
  onSave: (data: ManualRecordFormValues) => Promise<void>
  saving: boolean
}

export default function ManualForm({ categories, tags, onSave, saving }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ManualRecordFormValues>({
    resolver: zodResolver(manualRecordSchema),
    defaultValues: {
      title: '',
      amount: undefined,
      budgetCategoryId: '',
      tagIds: [],
      type: 'expense',
      date: getToday(),
      note: '',
    },
  })

  const recordType = watch('type')
  const budgetCategoryId = watch('budgetCategoryId')
  const tagIds = watch('tagIds')

  useEffect(() => {
    if (recordType === 'income' && budgetCategoryId !== 'income') {
      setValue('budgetCategoryId', 'income', { shouldValidate: true })
    }
    if (recordType === 'expense' && budgetCategoryId === 'income') {
      setValue('budgetCategoryId', '', { shouldValidate: true })
    }
  }, [budgetCategoryId, recordType, setValue])

  const onSubmit = async (data: ManualRecordFormValues) => {
    await onSave({
      ...data,
      budgetCategoryId: data.type === 'income' ? 'income' : data.budgetCategoryId,
    })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">消费内容</label>
        <Input
          {...register('title')}
          placeholder="如：午饭、地铁、买书"
          className="h-11 rounded-xl"
        />
        {errors.title && (
          <p className="text-destructive text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Amount + Type row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">金额</label>
          <Input
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0.00"
            className="h-11 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {errors.amount && (
            <p className="text-destructive text-xs mt-1">{errors.amount.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">类型</label>
          <select
            {...register('type')}
            className="flex h-11 w-full min-w-0 rounded-xl border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </div>
      </div>

      {/* Category + Date row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">预算分类</label>
          <select
            {...register('budgetCategoryId')}
            className="flex h-11 w-full min-w-0 rounded-xl border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <option value="">从哪个预算扣？</option>
            {categories
              .filter((cat) =>
                recordType === 'income' ? cat.id === 'income' : cat.budgetable
              )
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
          {errors.budgetCategoryId && (
            <p className="text-destructive text-xs mt-1">{errors.budgetCategoryId.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">日期</label>
          <Input
            type="date"
            {...register('date')}
            className="h-11 rounded-xl"
          />
          {errors.date && (
            <p className="text-destructive text-xs mt-1">{errors.date.message}</p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">标签（可选）</label>
          <span className="text-xs text-muted-foreground">用于筛选，不扣预算</span>
        </div>
        <TagSelector
          tags={tags}
          selectedIds={tagIds}
          onChange={(ids) => setValue('tagIds', ids, { shouldDirty: true })}
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">备注（可选）</label>
        <Input
          {...register('note')}
          placeholder="补充说明"
          className="h-11 rounded-xl"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={saving}
        className="w-full h-11 rounded-xl text-base font-semibold"
      >
        {saving ? '保存中...' : '保存'}
      </Button>
    </form>
  )
}
