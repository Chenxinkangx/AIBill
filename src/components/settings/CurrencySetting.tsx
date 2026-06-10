import { useSettingsStore } from '../../stores/settingsStore'

export default function CurrencySetting() {
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-gray-500">偏好设置</h2>

      <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-700">货币单位</span>
        <select
          value={settings?.currency ?? 'CNY'}
          onChange={(e) => updateSettings({ currency: e.target.value as 'CNY' })}
          className="text-sm text-gray-700 outline-none bg-transparent"
        >
          <option value="CNY">CNY (¥)</option>
          <option value="USD" disabled>USD ($) — 即将支持</option>
        </select>
      </div>

      <div className="bg-white rounded-xl px-4 py-3 space-y-1">
        <label className="text-xs text-gray-400">默认月预算</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">¥</span>
          <input
            type="number"
            min="0"
            value={settings?.defaultMonthBudget ?? ''}
            onChange={(e) =>
              updateSettings({
                defaultMonthBudget: Math.max(0, Number(e.target.value) || 0),
              })
            }
            placeholder="用于新建历史月份预算"
            className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder:text-gray-300"
          />
        </div>
      </div>
    </div>
  )
}
