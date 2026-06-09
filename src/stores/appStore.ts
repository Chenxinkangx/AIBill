import { create } from 'zustand'
import { initializeIfNeeded } from '../db/seed'

interface AppState {
  initialized: boolean
  initializing: boolean
  currentMonth: string // "2026-06"
  error: string | null

  initialize: () => Promise<void>
  setCurrentMonth: (month: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  initialized: false,
  initializing: true,
  currentMonth: '',
  error: null,

  initialize: async () => {
    set({ initializing: true, error: null })
    try {
      await initializeIfNeeded()
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      set({ initialized: true, initializing: false, currentMonth: month })
    } catch (err) {
      const message = err instanceof Error ? err.message : '初始化失败'
      set({ initialized: false, initializing: false, error: message })
    }
  },

  setCurrentMonth: (month: string) => set({ currentMonth: month }),
}))
