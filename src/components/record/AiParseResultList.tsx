import type { ParsedRecordItem, Category } from '../../types'

interface Props {
  items: ParsedRecordItem[]
  categories: Category[]
  onUpdate: (index: number, field: keyof ParsedRecordItem, value: string | number) => void
  onRemove: (index: number) => void
  onConfirm: () => void
  saving: boolean
}

export default function AiParseResultList({
  items,
  categories,
  onUpdate,
  onRemove,
  onConfirm,
  saving,
}: Props) {
  if (items.length === 0) return null

  const getOptionsForType = (type: ParsedRecordItem['type']) =>
    categories.filter((c) => (type === 'income' ? c.id === 'income' : c.budgetable))

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-100/80">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-700">
          识别结果（{items.length} 条）
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item, index) => (
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
                  onUpdate(index, 'categoryId', nextCategory?.id ?? '')
                  onUpdate(index, 'categoryName', nextCategory?.name ?? '')
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
                  getOptionsForType(item.type).some((c) => c.id === item.categoryId)
                    ? item.categoryId
                    : ''
                }
                onChange={(e) => {
                  const cat = categories.find((c) => c.id === e.target.value)
                  onUpdate(index, 'categoryId', e.target.value)
                  onUpdate(index, 'categoryName', cat?.name ?? '')
                }}
                aria-label="分类"
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
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={onConfirm}
          disabled={saving || items.length === 0}
          className="w-full py-3 bg-green-600 text-white rounded-2xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '保存中...' : `确认保存（${items.length} 条）`}
        </button>
      </div>
    </div>
  )
}
