import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { manualRecordSchema, type ManualRecordFormValues } from '@/services/record/validation'
import type { BudgetCategory, Tag } from '@/types'
import { getToday } from '@/utils/date'
import TagSelector from '@/components/common/TagSelector'
import FormField from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'

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
      <FormField label="消费内容" error={errors.title?.message}>
        <Input
          {...register('title')}
          placeholder="如：午饭、地铁、买书"
          className="h-11 rounded-xl"
        />
      </FormField>

      {/* Amount + Type row */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="金额" error={errors.amount?.message}>
          <Input
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0.00"
            className="h-11 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </FormField>
        <FormField label="类型">
          <NativeSelect
            options={[
              { value: 'expense', label: '支出' },
              { value: 'income', label: '收入' },
            ]}
            {...register('type')}
          />
        </FormField>
      </div>

      {/* Category + Date row */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="预算分类" error={errors.budgetCategoryId?.message}>
          <NativeSelect
            options={[
              { value: '', label: '从哪个预算扣？' },
              ...categories
                .filter((cat) =>
                  recordType === 'income' ? cat.id === 'income' : cat.budgetable
                )
                .map((cat) => ({ value: cat.id, label: cat.name })),
            ]}
            {...register('budgetCategoryId')}
          />
        </FormField>
        <FormField label="日期" error={errors.date?.message}>
          <Input
            type="date"
            {...register('date')}
            className="h-11 rounded-xl"
          />
        </FormField>
      </div>

      <FormField label="标签（可选）" description="用于筛选，不扣预算">
        <TagSelector
          tags={tags}
          selectedIds={tagIds}
          onChange={(ids) => setValue('tagIds', ids, { shouldDirty: true })}
        />
      </FormField>

      {/* Note */}
      <FormField label="备注（可选）">
        <Input
          {...register('note')}
          placeholder="补充说明"
          className="h-11 rounded-xl"
        />
      </FormField>

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
