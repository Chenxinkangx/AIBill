import { useCallback, useEffect, useState } from 'react'
import { db } from '../../db/index'
import type { Tag } from '../../types'
import { archiveTag, createTag, renameTag, restoreTag } from '../../services/tag/tagService'
import Toast from '../common/Toast'
import { useToast } from '../../hooks/useToast'

export default function TagManagement() {
  const [tags, setTags] = useState<Tag[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const { toast, showToast } = useToast()

  const load = useCallback(async () => {
    const data = await db.tags.orderBy('order').toArray()
    setTags(data)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const run = async (action: () => Promise<void>, success: string) => {
    try {
      await action()
      await load()
      showToast('success', success)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '操作失败')
    }
  }

  const active = tags.filter((tag) => !tag.archived)
  const archived = tags.filter((tag) => tag.archived)

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium text-gray-500">标签管理</h2>
        <p className="mt-1 text-xs text-gray-400">标签用于筛选和分析，不会扣减预算</p>
      </div>

      <div className="rounded-xl bg-white p-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                run(async () => {
                  await createTag(newName)
                  setNewName('')
                }, '标签已添加')
              }
            }}
            placeholder="例如：约会、外卖、冲动消费"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={() => run(async () => {
              await createTag(newName)
              setNewName('')
            }, '标签已添加')}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            添加
          </button>
        </div>

        {active.length === 0 ? (
          <p className="py-3 text-center text-sm text-gray-400">暂时没有标签</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {active.map((tag) => (
              <div key={tag.id} className="flex items-center gap-3 py-2.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                {editingId === tag.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm outline-none focus:border-indigo-400"
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{tag.name}</span>
                )}
                {editingId === tag.id ? (
                  <button
                    type="button"
                    onClick={() => run(async () => {
                      await renameTag(tag.id, editingName)
                      setEditingId(null)
                    }, '标签已更新')}
                    className="text-xs font-medium text-indigo-600"
                  >保存</button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditingId(tag.id); setEditingName(tag.name) }}
                    className="text-xs text-gray-400"
                  >重命名</button>
                )}
                <button
                  type="button"
                  onClick={() => run(() => archiveTag(tag.id), '标签已归档')}
                  className="text-xs text-gray-400"
                >归档</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {archived.length > 0 && (
        <div className="rounded-xl bg-white px-4 py-2">
          {archived.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between border-b border-gray-50 py-2.5 last:border-0">
              <span className="text-sm text-gray-400">{tag.name}</span>
              <button
                type="button"
                onClick={() => run(() => restoreTag(tag.id), '标签已恢复')}
                className="text-xs font-medium text-indigo-600"
              >恢复</button>
            </div>
          ))}
        </div>
      )}
      <Toast toast={toast} />
    </div>
  )
}
