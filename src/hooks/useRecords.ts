import { useEffect, useState, useCallback } from 'react'
import type { RecordItem, Category } from '../types'
import { getRecordsByMonth } from '../services/record/recordService'
import { db } from '../db/index'

export function useRecords(month: string, categoryFilters: string[] = []) {
  const [records, setRecords] = useState<RecordItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const normalizedFilters = categoryFilters.join('|')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, cats] = await Promise.all([
        getRecordsByMonth(month),
        db.categories.toArray(),
      ])
      const selected = new Set(categoryFilters)
      setRecords(
        selected.size === 0
          ? data
          : data.filter((record) => selected.has(record.categoryId))
      )
      setCategories(cats)
    } finally {
      setLoading(false)
    }
  }, [month, normalizedFilters])

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
    loading,
    refresh,
    getCategoryName,
  }
}
