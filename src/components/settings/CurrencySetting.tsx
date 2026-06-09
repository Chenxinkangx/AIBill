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
    </div>
  )
}
