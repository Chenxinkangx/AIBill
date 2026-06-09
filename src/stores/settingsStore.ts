import { create } from 'zustand'
import type { AppSettings } from '../types'
import { db } from '../db/index'

const SETTINGS_KEY = 'CNY'

const SECRETS_KEY = 'aibill:secrets'

function loadSecrets(): { aiApiKey?: string } {
  try {
    const raw = localStorage.getItem(SECRETS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveSecrets(secrets: { aiApiKey?: string }) {
  localStorage.setItem(SECRETS_KEY, JSON.stringify(secrets))
}

interface SettingsState {
  settings: AppSettings | null
  aiApiKey: string
  loading: boolean

  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  setAiApiKey: (key: string) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  aiApiKey: loadSecrets().aiApiKey ?? '',
  loading: true,

  loadSettings: async () => {
    set({ loading: true })
    try {
      const settings = await db.settings.get(SETTINGS_KEY)
      const secrets = loadSecrets()
      set({
        settings: settings ?? { currency: 'CNY' },
        aiApiKey: secrets.aiApiKey ?? '',
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  updateSettings: async (partial: Partial<AppSettings>) => {
    const current = get().settings ?? { currency: 'CNY' as const }
    const updated = { ...current, ...partial }
    await db.settings.put(updated)
    set({ settings: updated })
  },

  setAiApiKey: (key: string) => {
    saveSecrets({ aiApiKey: key })
    set({ aiApiKey: key })
  },
}))
