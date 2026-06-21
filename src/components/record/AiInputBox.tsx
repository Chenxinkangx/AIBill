import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  onParse: () => void
  parsing: boolean
  autoFocus?: boolean
  focusRequestKey?: number
}

export default function AiInputBox({
  value,
  onChange,
  onParse,
  parsing,
  autoFocus,
  focusRequestKey = 0,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!autoFocus) return
    const timer = window.setTimeout(() => {
      textareaRef.current?.focus()
    }, 80)
    return () => window.clearTimeout(timer)
  }, [autoFocus, focusRequestKey])

  return (
    <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm shadow-gray-100/80">
      <label className="text-sm font-medium text-gray-600">
        输入消费记录
      </label>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例如：今天午饭18，地铁4，买书36，电影45"
        rows={3}
        className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/70 text-base outline-none focus:border-indigo-400 focus:bg-white transition-colors resize-none placeholder:text-gray-400"
      />
      <button
        onClick={onParse}
        disabled={parsing || !value.trim()}
        className="w-full py-3 bg-indigo-500 text-white rounded-2xl text-sm font-semibold hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {parsing ? 'AI 解析中...' : '智能识别'}
      </button>
    </div>
  )
}
