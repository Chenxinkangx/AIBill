import DataManagement from '@/components/settings/DataManagement'
import AiConfig from '@/components/settings/AiConfig'
import CurrencySetting from '@/components/settings/CurrencySetting'
import TagManagement from '@/components/settings/TagManagement'
import { Card } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">设置</h1>

      <DataManagement />
      <TagManagement />
      <AiConfig />
      <CurrencySetting />

      {/* About */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">关于</h2>
        <Card className="rounded-xl px-4 py-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">版本</span>
            <span className="text-sm text-muted-foreground">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">应用</span>
            <span className="text-sm text-muted-foreground">AI 预算记账助手</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
