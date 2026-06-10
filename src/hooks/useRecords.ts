import { useEffect, useState, useCallback } from 'react'
import type { RecordItem, Category } from '../types'
import { getRecordsByMonth, getRecordsByMonthAndCategory } from '../services/record/recordService'
import { db } from '../db/index'

export function useRecords(month: string, categoryFilter: string = 'all') {
  const [records, setRecords] = useState<RecordItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, cats] = await Promise.all([
        categoryFilter === 'all'
          ? getRecordsByMonth(month)
          : getRecordsByMonthAndCategory(month, categoryFilter),
        db.categories.toArray(),
      ])
      setRecords(data)
      setCategories(cats)
    } finally {
      setLoading(false)
    }
  }, [month, categoryFilter])

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
