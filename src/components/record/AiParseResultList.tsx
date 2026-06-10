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
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-50">
        <p className="text-sm font-medium text-gray-700">
          识别结果（{items.length} 条）
        </p>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((item, index) => (
          <div key={index} className="px-4 py-3 space-y-2">
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
                className="text-red-400 hover:text-red-600 text-xs shrink-0 ml-2"
              >
                删除
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <input
                type="number"
                value={item.amount}
                onChange={(e) => onUpdate(index, 'amount', Number(e.target.value))}
                className="w-20 px-2 py-1 bg-gray-50 rounded-lg text-gray-700 text-sm outline-none [appearance:textfield]"
              />
              <span className="text-gray-300">|</span>
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
                className="text-sm text-gray-600 outline-none bg-transparent"
              >
                <option value="expense">支出</option>
                <option value="income">收入</option>
              </select>
              <span className="text-gray-300">|</span>
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
                className="text-sm text-gray-600 outline-none bg-transparent"
              >
                {getOptionsForType(item.type).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <span className="text-gray-300">|</span>
              <input
                type="date"
                value={item.date}
                onChange={(e) => onUpdate(index, 'date', e.target.value)}
                className="text-xs text-gray-500 outline-none bg-transparent"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-50">
        <button
          onClick={onConfirm}
          disabled={saving || items.length === 0}
          className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '保存中...' : `确认保存（${items.length} 条）`}
        </button>
      </div>
    </div>
  )
}
