import type { ParsedRecordItem, BudgetCategory, Tag } from '../../types'
import TagSelector from '../common/TagSelector'

interface Props {
  items: ParsedRecordItem[]
  categories: BudgetCategory[]
  tags: Tag[]
  onUpdate: (index: number, field: keyof ParsedRecordItem, value: string | number | string[]) => void
  onRemove: (index: number) => void
  onConfirm: () => void
  saving: boolean
}

export default function AiParseResultList({
  items,
  categories,
  tags,
  onUpdate,
  onRemove,
  onConfirm,
  saving,
}: Props) {
  if (items.length === 0) return null

  const getOptionsForType = (type: ParsedRecordItem['type']) =>
    categories.filter((c) => (type === 'income' ? c.id === 'income' : c.budgetable))
  const existingTagNames = new Set(tags.filter((tag) => !tag.archived).map((tag) => tag.name))
  const newTagNames = [...new Set(items.flatMap((item) => item.tagNames))]
    .filter((name) => !existingTagNames.has(name))

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-100/80">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-700">
          识别结果（{items.length} 条）
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item, index) => {
          const suggestedNames = item.tagNames.filter((name) => !existingTagNames.has(name))
          return (
          <div key={index} className="px-4 py-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {item.confidence < 0.7 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded shrink-0">
                    请确认
                  </span>
                )}
                <input
                  value={item.title}
                  onChange={(e) => onUpdate(index, 'title', e.target.value)}
                  className="text-sm font-medium text-gray-800 outline-none bg-transparent flex-1 min-w-0"
                />
              </div>
              <button
                onClick={() => onRemove(index)}
                className="text-red-500 hover:text-red-600 text-xs shrink-0 ml-2 px-2 py-1 rounded-lg hover:bg-red-50"
              >
                删除
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm sm:flex sm:items-center">
              <input
                type="number"
                value={item.amount}
                onChange={(e) => onUpdate(index, 'amount', Number(e.target.value))}
                aria-label="金额"
                className="w-full min-w-0 px-3 py-2 bg-gray-50 rounded-xl border border-transparent text-gray-800 text-sm outline-none focus:bg-white focus:border-indigo-300 [appearance:textfield] sm:w-20"
              />
              <span className="hidden sm:inline text-gray-300">|</span>
              <select
                value={item.type}
                onChange={(e) => {
                  const type = e.target.value as ParsedRecordItem['type']
                  const nextCategory =
                    type === 'income'
                      ? categories.find((c) => c.id === 'income')
                      : categories.find((c) => c.budgetable && c.id !== 'income')
                  onUpdate(index, 'type', type)
                  onUpdate(index, 'budgetCategoryId', nextCategory?.id ?? '')
                  onUpdate(index, 'budgetCategoryName', nextCategory?.name ?? '')
                }}
                aria-label="类型"
                className="w-full min-w-0 px-3 py-2 bg-gray-50 rounded-xl border border-transparent text-sm text-gray-700 outline-none focus:bg-white focus:border-indigo-300 sm:w-auto sm:bg-transparent sm:px-0 sm:py-0"
              >
                <option value="expense">支出</option>
                <option value="income">收入</option>
              </select>
              <span className="hidden sm:inline text-gray-300">|</span>
              <select
                value={
                  getOptionsForType(item.type).some((c) => c.id === item.budgetCategoryId)
                    ? item.budgetCategoryId
                    : ''
                }
                onChange={(e) => {
                  const cat = categories.find((c) => c.id === e.target.value)
                  onUpdate(index, 'budgetCategoryId', e.target.value)
                  onUpdate(index, 'budgetCategoryName', cat?.name ?? '')
                }}
                aria-label="预算分类"
                className="w-full min-w-0 px-3 py-2 bg-gray-50 rounded-xl border border-transparent text-sm text-gray-700 outline-none focus:bg-white focus:border-indigo-300 sm:w-auto sm:bg-transparent sm:px-0 sm:py-0"
              >
                {getOptionsForType(item.type).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <span className="hidden sm:inline text-gray-300">|</span>
              <input
                type="date"
                value={item.date}
                onChange={(e) => onUpdate(index, 'date', e.target.value)}
                aria-label="日期"
                className="w-full min-w-0 px-3 py-2 bg-gray-50 rounded-xl border border-transparent text-sm text-gray-700 outline-none focus:bg-white focus:border-indigo-300 sm:w-auto sm:bg-transparent sm:px-0 sm:py-0 sm:text-xs sm:text-gray-500"
              />
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-400">标签（可选，不扣预算）</p>
              <TagSelector
                tags={tags}
                compact
                selectedIds={tags.filter((tag) => item.tagNames.includes(tag.name)).map((tag) => tag.id)}
                onChange={(ids) =>
                  onUpdate(
                    index,
                    'tagNames',
                    [
                      ...ids.map((id) => tags.find((tag) => tag.id === id)?.name).filter((name): name is string => Boolean(name)),
                      ...suggestedNames,
                    ]
                  )
                }
              />
              {suggestedNames.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestedNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      title="点击移除建议"
                      onClick={() => onUpdate(index, 'tagNames', item.tagNames.filter((tagName) => tagName !== name))}
                      className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
                    >
                      <span className="mr-1 text-[10px] font-bold uppercase text-amber-500">新</span>
                      {name}
                      <span className="ml-1.5 text-amber-400">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          )
        })}
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={onConfirm}
          disabled={saving || items.length === 0}
          className="w-full py-3 bg-green-600 text-white rounded-2xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving
            ? '保存中...'
            : `确认保存（${items.length} 条${newTagNames.length > 0 ? `，新建 ${newTagNames.length} 个标签` : ''}）`}
        </button>
      </div>
    </div>
  )
}
