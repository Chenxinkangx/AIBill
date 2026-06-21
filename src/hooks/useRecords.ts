import { useEffect, useState, useCallback } from 'react'
import type { RecordItem, BudgetCategory, Tag } from '../types'
import { getRecordsByMonth } from '../services/record/recordService'
import { db } from '../db/index'

export function useRecords(month: string, categoryFilters: string[] = [], tagFilters: string[] = []) {
  const [records, setRecords] = useState<RecordItem[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const normalizedFilters = categoryFilters.join('|')
  const normalizedTagFilters = tagFilters.join('|')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, cats, loadedTags] = await Promise.all([
        getRecordsByMonth(month),
        db.categories.toArray(),
        db.tags.toArray(),
      ])
      const selected = new Set(categoryFilters)
      const filtered =
        selected.size === 0
          ? data
          : data.filter((record) => selected.has(record.budgetCategoryId))
      const selectedTags = new Set(tagFilters)
      const tagFiltered = selectedTags.size === 0
        ? filtered
        : filtered.filter((record) => record.tagIds.some((id) => selectedTags.has(id)))
      setRecords(sortRecordsByDateTime(tagFiltered))
      setCategories(cats)
      setTags(loadedTags)
    } finally {
      setLoading(false)
    }
  }, [month, normalizedFilters, normalizedTagFilters])

  useEffect(() => {
    load()
  }, [load])

  const refresh = load

  // Group records by date
  const groupedRecords = records.reduce<
    Record<string, RecordItem[]>
  >((groups, record) => {
    if (!groups[record.date]) {
      groups[record.date] = []
    }
    groups[record.date].push(record)
    return groups
  }, {})

  // Sort dates descending
  const sortedDates = Object.keys(groupedRecords).sort((a, b) =>
    b.localeCompare(a)
  )

  const getCategoryName = useCallback(
    (categoryId: string) => {
      if (categoryId === 'income') return '收入'
      return categories.find((c) => c.id === categoryId)?.name ?? '已删除'
    },
    [categories]
  )

  return {
    records,
    groupedRecords,
    sortedDates,
    categories,
    tags,
    loading,
    refresh,
    getCategoryName,
  }
}

function sortRecordsByDateTime(records: RecordItem[]) {
  return [...records].sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date)
    if (dateDiff !== 0) return dateDiff

    const bTime = Date.parse(b.createdAt || b.updatedAt)
    const aTime = Date.parse(a.createdAt || a.updatedAt)
    return safeTime(bTime) - safeTime(aTime)
  })
}

function safeTime(value: number) {
  return Number.isNaN(value) ? 0 : value
}
