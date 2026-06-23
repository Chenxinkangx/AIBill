import { useSettingsStore } from '@/stores/settingsStore'
import { Card } from '@/components/ui/card'
import { NativeSelect } from '@/components/ui/native-select'
import { Input } from '@/components/ui/input'

export default function CurrencySetting() {
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">偏好设置</h2>

      <Card className="rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-foreground">货币单位</span>
        <NativeSelect
          value={settings?.currency ?? 'CNY'}
          onChange={(e) => updateSettings({ currency: e.target.value as 'CNY' })}
          options={[
            { value: 'CNY', label: 'CNY (¥)' },
            { value: 'USD', label: 'USD ($) — 即将支持' },
          ]}
          className="w-auto border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 [&>option:disabled]:text-muted-foreground"
        />
      </Card>

      <Card className="rounded-xl px-4 py-3 space-y-1">
        <label className="text-xs text-muted-foreground">默认月预算</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">¥</span>
          <Input
            type="number"
            min="0"
            value={settings?.defaultMonthBudget ?? ''}
            onChange={(e) =>
              updateSettings({
                defaultMonthBudget: Math.max(0, Number(e.target.value) || 0),
              })
            }
            placeholder="用于新建历史月份预算"
            className="flex-1 h-auto border-0 bg-transparent p-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          />
        </div>
      </Card>
    </div>
  )
}
