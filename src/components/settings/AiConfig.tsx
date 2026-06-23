import { useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { Card } from '@/components/ui/card'

export default function AiConfig() {
  const aiApiKey = useSettingsStore((s) => s.aiApiKey)
  const setAiApiKey = useSettingsStore((s) => s.setAiApiKey)
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyKey = async () => {
    if (aiApiKey) {
      await navigator.clipboard.writeText(aiApiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">AI 配置</h2>

      {/* AI Model */}
      <Card className="rounded-xl px-4 py-3 space-y-1">
        <label className="text-xs text-muted-foreground">AI 模型</label>
        <select
          value={settings?.aiModel ?? 'deepseek-v4-flash'}
          onChange={(e) => updateSettings({ aiModel: e.target.value })}
          className="w-full text-sm text-foreground outline-none bg-transparent"
        >
          <option value="deepseek-v4-flash">DeepSeek V4 Flash</option>
          <option value="deepseek-v4-pro">DeepSeek V4 Pro</option>
        </select>
      </Card>

      {/* API Key */}
      <Card className="rounded-xl px-4 py-3 space-y-1">
        <label className="text-xs text-muted-foreground">API Key</label>
        <div className="flex items-center gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={aiApiKey}
            onChange={(e) => setAiApiKey(e.target.value)}
            placeholder="sk-..."
            className="flex-1 text-sm text-foreground outline-none bg-transparent placeholder:text-muted-foreground"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            {showKey ? '隐藏' : '显示'}
          </button>
          {aiApiKey && (
            <button
              onClick={handleCopyKey}
              className="text-xs text-primary hover:text-primary shrink-0"
            >
              {copied ? '已复制' : '复制'}
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          API Key 仅保存在本机浏览器，不会上传到任何服务器
        </p>
      </Card>
    </div>
  )
}
