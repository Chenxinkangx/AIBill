import { z } from 'zod'

export const manualRecordSchema = z.object({
  title: z.string().min(1, '请填写消费内容'),
  amount: z
    .number({ message: '请输入有效金额' })
    .positive('金额必须大于 0'),
  budgetCategoryId: z.string().min(1, '请选择预算分类'),
  tagIds: z.array(z.string()),
  type: z.enum(['expense', 'income']),
  date: z.string().min(1, '请选择日期'),
  note: z.string().optional(),
})

export type ManualRecordFormValues = z.infer<typeof manualRecordSchema>
