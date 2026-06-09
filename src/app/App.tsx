import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import DashboardPage from '../pages/DashboardPage'
import AddRecordPage from '../pages/AddRecordPage'
import RecordsPage from '../pages/RecordsPage'
import BudgetPage from '../pages/BudgetPage'
import SettingsPage from '../pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="add" element={<AddRecordPage />} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
