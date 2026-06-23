import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import DashboardPage from '@/pages/DashboardPage'
import AddRecordPage from '@/pages/AddRecordPage'
import RecordsPage from '@/pages/RecordsPage'
import BudgetPage from '@/pages/BudgetPage'
import SettingsPage from '@/pages/SettingsPage'
import { useAppStore } from '@/stores/appStore'
import { useSettingsStore } from '@/stores/settingsStore'

function AppContent() {
  const { initialized, initializing, error, initialize } = useAppStore()
  const { loadSettings } = useSettingsStore()

  useEffect(() => {
    initialize().then(() => {
      loadSettings()
    })
  }, [initialize, loadSettings])

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground text-lg">加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-2">
          <p className="text-destructive text-lg">初始化失败</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => initialize()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  if (!initialized) return null

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="add" element={<AddRecordPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
