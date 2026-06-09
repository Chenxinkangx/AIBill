import { create } from 'zustand'
import type { RecordItem, ParsedRecordItem } from '../types'
import { db } from '../db/index'
import { generateId } from '../utils/id'

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
    const now = new Date().toISOString()
    const record: RecordItem = {
      ...item,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    await db.records.add(record)
    set((state) => ({ records: [record, ...state.records] }))
  },

  addRecordsFromParsed: async (items: ParsedRecordItem[], month: string): Promise<number> => {
    const now = new Date().toISOString()
    const [year] = month.split('-')

    const records: RecordItem[] = items.map((item) => {
      // Ensure date is in the correct format
      const date = item.date || now.slice(0, 10)
      return {
        id: generateId(),
        title: item.title,
        amount: item.amount,
        categoryId: item.categoryId ?? 'cat-other',
        type: item.type,
        date,
        source: 'ai' as const,
        createdAt: now,
        updatedAt: now,
      }
    })

    await db.records.bulkAdd(records)
    // Reload to keep state in sync
    const currentRecords = await db.records
      .where('date')
      .between(
        `${year}-01-01`,
        `${year}-12-31`,
        true,
        true
      )
      .reverse()
      .toArray()
    set({ records: currentRecords })
    return records.length
  },

  updateRecord: async (id: string, partial: Partial<RecordItem>) => {
    const now = new Date().toISOString()
    await db.records.update(id, { ...partial, updatedAt: now })
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, ...partial, updatedAt: now } : r
      ),
    }))
  },

  deleteRecord: async (id: string) => {
    await db.records.delete(id)
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
    }))
  },
}))
