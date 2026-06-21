import { db } from '../../db/index'
import { generateId } from '../../utils/id'
import type { ParsedRecordItem, RecordItem } from '../../types'
import { getOrCreateTagsByNames, validateTagIds } from '../tag/tagService'

export function normalizeRecordInput(
  data: Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'>
): Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'> {
  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new Error('金额必须大于 0')
  }

  return {
    ...data,
    title: data.title.trim(),
    amount: data.amount,
    budgetCategoryId: data.type === 'income' ? 'income' : data.budgetCategoryId,
  }
}

export async function createRecord(
  data: Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<RecordItem> {
  const now = new Date().toISOString()
  const normalized = normalizeRecordInput(data)
  const tagIds = await validateTagIds(normalized.tagIds)
  const record: RecordItem = {
    ...normalized,
    tagIds,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  await db.records.add(record)
  return record
}

export async function createRecordsFromParsed(items: ParsedRecordItem[]): Promise<RecordItem[]> {
  const now = new Date().toISOString()
  if (items.some((item) => !Number.isFinite(item.amount) || item.amount <= 0)) {
    throw new Error('金额必须大于 0')
  }

  return db.transaction('rw', db.tags, db.records, async () => {
    const tagMap = new Map<string, string>()
    const allNames = [...new Set(items.flatMap((item) => item.tagNames))]
    const resolvedTags = await getOrCreateTagsByNames(allNames)
    resolvedTags.forEach((tag) => tagMap.set(tag.name, tag.id))

    const records: RecordItem[] = items.map((item) => ({
      id: generateId(),
      title: item.title.trim() || '未命名',
      amount: item.amount,
      budgetCategoryId: item.type === 'income' ? 'income' : item.budgetCategoryId ?? 'cat-other',
      tagIds: item.tagNames.map((name) => tagMap.get(name)).filter((id): id is string => Boolean(id)),
      type: item.type,
      date: item.date,
      source: 'ai',
      createdAt: now,
      updatedAt: now,
    }))
    await db.records.bulkAdd(records)
    return records
  })
}

export async function updateRecord(
  id: string,
  partial: Partial<RecordItem>
): Promise<void> {
  const now = new Date().toISOString()
  const next =
    partial.type === 'income'
      ? { ...partial, budgetCategoryId: 'income' }
      : partial
  if (next.tagIds) next.tagIds = await validateTagIds(next.tagIds)
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
  budgetCategoryId: string
): Promise<RecordItem[]> {
  const [year, monthNum] = month.split('-')
  const startDate = `${year}-${monthNum}-01`
  const lastDay = new Date(Number(year), Number(monthNum), 0).getDate()
  const endDate = `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`

  if (budgetCategoryId === 'all') {
    return getRecordsByMonth(month)
  }

  return db.records
    .where('[budgetCategoryId+date]')
    .between([budgetCategoryId, startDate], [budgetCategoryId, endDate], true, true)
    .reverse()
    .toArray()
}
