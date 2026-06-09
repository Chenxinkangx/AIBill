import DataManagement from '../components/settings/DataManagement'
import AiConfig from '../components/settings/AiConfig'
import CurrencySetting from '../components/settings/CurrencySetting'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">设置</h1>

      <DataManagement />
      <AiConfig />
      <CurrencySetting />

      {/* About */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">关于</h2>
        <div className="bg-white rounded-xl px-4 py-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">版本</span>
            <span className="text-sm text-gray-400">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">应用</span>
            <span className="text-sm text-gray-400">AI 预算记账助手</span>
          </div>
        </div>
      </div>
    </div>
  )
}
