import { create } from 'zustand'
import type { RecordItem, ParsedRecordItem } from '../types'
import { db } from '../db/index'
import {
  createRecord,
  createRecordsFromParsed,
  deleteRecord,
  updateRecord,
} from '../services/record/recordService'

interface RecordState {
  records: RecordItem[]
  loading: boolean

  loadRecordsByMonth: (month: string) => Promise<void>
  addRecord: (item: Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  addRecordsFromParsed: (items: ParsedRecordItem[], month: string) => Promise<number>
  updateRecord: (id: string, partial: Partial<RecordItem>) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
}

export const useRecordStore = create<RecordState>((set) => ({
  records: [],
  loading: false,

  loadRecordsByMonth: async (month: string) => {
    set({ loading: true })
    const [year, monthNum] = month.split('-')
    const startDate = `${year}-${monthNum}-01`
    // Calculate last day of month
    const lastDay = new Date(Number(year), Number(monthNum), 0).getDate()
    const endDate = `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`

    const records = await db.records
      .where('date')
      .between(startDate, endDate, true, true)
      .reverse()
      .toArray()

    set({ records, loading: false })
  },

  addRecord: async (item) => {
    const record = await createRecord(item)
    set((state) => ({ records: [record, ...state.records] }))
  },

  addRecordsFromParsed: async (items: ParsedRecordItem[], month: string): Promise<number> => {
    await createRecordsFromParsed(items)
    const [year, monthNum] = month.split('-')
    const startDate = `${year}-${monthNum}-01`
    const lastDay = new Date(Number(year), Number(monthNum), 0).getDate()
    const endDate = `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`
    const currentRecords = await db.records
      .where('date')
      .between(startDate, endDate, true, true)
      .reverse()
      .toArray()
    set({ records: currentRecords })
    return items.length
  },

  updateRecord: async (id: string, partial: Partial<RecordItem>) => {
    await updateRecord(id, partial)
    const now = new Date().toISOString()
    const nextPartial =
      partial.type === 'income'
        ? { ...partial, budgetCategoryId: 'income' }
        : partial
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, ...nextPartial, updatedAt: now } : r
      ),
    }))
  },

  deleteRecord: async (id: string) => {
    await deleteRecord(id)
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
    }))
  },
}))
