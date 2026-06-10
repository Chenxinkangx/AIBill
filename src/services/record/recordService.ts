import { db } from '../../db/index'
import { generateId } from '../../utils/id'
import type { ParsedRecordItem, RecordItem } from '../../types'

export function normalizeRecordInput(
  data: Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'>
): Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    ...data,
    title: data.title.trim(),
    amount: Math.max(0, data.amount),
    categoryId: data.type === 'income' ? 'income' : data.categoryId,
  }
}

export async function createRecord(
  data: Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<RecordItem> {
  const now = new Date().toISOString()
  const normalized = normalizeRecordInput(data)
  const record: RecordItem = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  await db.records.add(record)
  return record
}

export async function createRecordsFromParsed(items: ParsedRecordItem[]): Promise<RecordItem[]> {
  const now = new Date().toISOString()
  const records: RecordItem[] = items.map((item) => ({
    id: generateId(),
    title: item.title.trim() || '未命名',
    amount: Math.max(0, item.amount),
    categoryId: item.type === 'income' ? 'income' : item.categoryId ?? 'cat-other',
    type: item.type,
    date: item.date,
    source: 'ai',
    createdAt: now,
    updatedAt: now,
  }))

  await db.records.bulkAdd(records)
  return records
}

export async function updateRecord(
  id: string,
  partial: Partial<RecordItem>
): Promise<void> {
  const now = new Date().toISOString()
  const next =
    partial.type === 'income'
      ? { ...partial, categoryId: 'income' }
      : partial
  await db.records.update(id, { ...next, updatedAt: now })
}

export async function deleteRecord(id: string): Promise<void> {
  await db.records.delete(id)
}

export async function getRecordsByMonth(month: string): Promise<RecordItem[]> {
  const [year, monthNum] = month.split('-')
  const startDate = `${year}-${monthNum}-01`
  const lastDay = new Date(Number(year), Number(monthNum), 0).getDate()
  const endDate = `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`
  return db.records
    .where('date')
    .between(startDate, endDate, true, true)
    .reverse()
    .toArray()
}

export async function getRecordsByMonthAndCategory(
  month: string,
  categoryId: string
): Promise<RecordItem[]> {
  const [year, monthNum] = month.split('-')
  const startDate = `${year}-${monthNum}-01`
  const lastDay = new Date(Number(year), Number(monthNum), 0).getDate()
  const endDate = `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`

  if (categoryId === 'all') {
    return getRecordsByMonth(month)
  }

  return db.records
    .where('[categoryId+date]')
    .between([categoryId, startDate], [categoryId, endDate], true, true)
    .reverse()
    .toArray()
}
