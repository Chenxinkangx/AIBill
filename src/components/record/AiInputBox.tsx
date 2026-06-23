import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  value: string
  onChange: (value: string) => void
  onParse: () => void
  parsing: boolean
  hasParsedResult?: boolean
  autoFocus?: boolean
  focusRequestKey?: number
}

export default function AiInputBox({
  value,
  onChange,
  onParse,
  parsing,
  hasParsedResult = false,
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
    <div className="bg-card rounded-2xl p-4 space-y-3 shadow-sm">
      <label className="text-sm font-medium text-muted-foreground">
        输入消费记录
      </label>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例如：今天午饭18，地铁4，买书36，电影45"
        rows={3}
        className="w-full rounded-xl resize-none"
      />
      <Button
        onClick={onParse}
        disabled={parsing || !value.trim()}
        className="w-full h-11 rounded-xl text-sm font-semibold"
      >
        {parsing ? 'AI 解析中...' : hasParsedResult ? '重新识别' : '智能识别'}
      </Button>
    </div>
  )
}
