import { db } from '../../db/index'
import { generateId } from '../../utils/id'
import type { RecordItem } from '../../types'

export async function createRecord(
  data: Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<RecordItem> {
  const now = new Date().toISOString()
  const record: RecordItem = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  await db.records.add(record)
  return record
}

export async function updateRecord(
  id: string,
  partial: Partial<RecordItem>
): Promise<void> {
  const now = new Date().toISOString()
  await db.records.update(id, { ...partial, updatedAt: now })
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
