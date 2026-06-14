import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { manualRecordSchema, type ManualRecordFormValues } from '../../services/record/validation'
import type { Category } from '../../types'
import { getToday } from '../../utils/date'

interface Props {
  categories: Category[]
  onSave: (data: ManualRecordFormValues) => Promise<void>
  saving: boolean
}

export default function ManualForm({ categories, onSave, saving }: Props) {
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
      categoryId: '',
      type: 'expense',
      date: getToday(),
      note: '',
    },
  })

  const recordType = watch('type')
  const categoryId = watch('categoryId')

  useEffect(() => {
    if (recordType === 'income' && categoryId !== 'income') {
      setValue('categoryId', 'income', { shouldValidate: true })
    }
    if (recordType === 'expense' && categoryId === 'income') {
      setValue('categoryId', '', { shouldValidate: true })
    }
  }, [categoryId, recordType, setValue])

  const onSubmit = async (data: ManualRecordFormValues) => {
    await onSave({
      ...data,
      categoryId: data.type === 'income' ? 'income' : data.categoryId,
    })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">消费内容</label>
        <input
          {...register('title')}
          placeholder="如：午饭、地铁、买书"
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-base outline-none focus:border-indigo-400 transition-colors"
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Amount + Type row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">金额</label>
          <input
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0.00"
            className="w-full min-w-0 px-4 py-3 rounded-2xl border border-gray-200 bg-white text-base outline-none focus:border-indigo-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">类型</label>
          <select
            {...register('type')}
            className="w-full min-w-0 px-4 py-3 rounded-2xl border border-gray-200 text-base outline-none focus:border-indigo-400 transition-colors bg-white"
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </div>
      </div>

      {/* Category + Date row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">分类</label>
          <select
            {...register('categoryId')}
            className="w-full min-w-0 px-4 py-3 rounded-2xl border border-gray-200 text-base outline-none focus:border-indigo-400 transition-colors bg-white"
          >
            <option value="">选择分类</option>
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
          {errors.categoryId && (
            <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">日期</label>
          <input
            type="date"
            {...register('date')}
            className="w-full min-w-0 px-4 py-3 rounded-2xl border border-gray-200 bg-white text-base outline-none focus:border-indigo-400 transition-colors"
          />
          {errors.date && (
            <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
          )}
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">备注（可选）</label>
        <input
          {...register('note')}
          placeholder="补充说明"
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-base outline-none focus:border-indigo-400 transition-colors"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 bg-indigo-500 text-white rounded-2xl font-semibold hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? '保存中...' : '保存'}
      </button>
    </form>
  )
}
