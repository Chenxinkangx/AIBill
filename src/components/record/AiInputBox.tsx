interface Props {
  value: string
  onChange: (value: string) => void
  onParse: () => void
  parsing: boolean
}

export default function AiInputBox({ value, onChange, onParse, parsing }: Props) {
  return (
    <div className="bg-white rounded-xl p-4 space-y-3">
      <label className="text-sm font-medium text-gray-600">
        输入消费记录
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例如：今天午饭18，地铁4，买书36，电影45"
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 transition-colors resize-none placeholder:text-gray-300"
      />
      <button
        onClick={onParse}
        disabled={parsing || !value.trim()}
        className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {parsing ? 'AI 解析中...' : '智能识别'}
      </button>
    </div>
  )
}
