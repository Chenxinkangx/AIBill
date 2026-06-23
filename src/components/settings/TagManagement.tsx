import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { db } from '@/db/index'
import type { Tag } from '@/types'
import { archiveTag, createTag, renameTag, restoreTag } from '@/services/tag/tagService'
import Toast from '@/components/common/Toast'
import { useToast } from '@/hooks/useToast'

const PAGE_SIZE = 6

export default function TagManagement() {
  const [tags, setTags] = useState<Tag[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [activePage, setActivePage] = useState(1)
  const [archivedPage, setArchivedPage] = useState(1)
  const { toast, showToast } = useToast()

  const load = useCallback(async () => {
    const data = await db.tags.orderBy('order').toArray()
    setTags(data)
    return data
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
  const activePageCount = Math.max(1, Math.ceil(active.length / PAGE_SIZE))
  const archivedPageCount = Math.max(1, Math.ceil(archived.length / PAGE_SIZE))
  const visibleActive = active.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)
  const visibleArchived = archived.slice((archivedPage - 1) * PAGE_SIZE, archivedPage * PAGE_SIZE)

  useEffect(() => {
    setActivePage((page) => Math.min(page, activePageCount))
  }, [activePageCount])

  useEffect(() => {
    setArchivedPage((page) => Math.min(page, archivedPageCount))
  }, [archivedPageCount])

  const handleCreateTag = async () => {
    try {
      await createTag(newName)
      setNewName('')
      const data = await load()
      const activeCount = data.filter((tag) => !tag.archived).length
      setActivePage(Math.max(1, Math.ceil(activeCount / PAGE_SIZE)))
      showToast('success', '标签已添加')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '添加标签失败')
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">标签管理</h2>
        <p className="mt-1 text-xs text-muted-foreground">标签用于筛选和分析，不会扣减预算</p>
      </div>

      <Card className="rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleCreateTag()
              }
            }}
            placeholder="例如：约会、外卖、冲动消费"
          />
          <Button
            type="button"
            onClick={() => void handleCreateTag()}
          >
            添加
          </Button>
        </div>

        {active.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">暂时没有标签</p>
        ) : (
          <div className="divide-y divide-border">
            {visibleActive.map((tag) => (
              <div key={tag.id} className="flex items-center gap-3 py-2.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                {editingId === tag.id ? (
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    className="min-w-0 flex-1"
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{tag.name}</span>
                )}
                {editingId === tag.id ? (
                  <button
                    type="button"
                    onClick={() => run(async () => {
                      await renameTag(tag.id, editingName)
                      setEditingId(null)
                    }, '标签已更新')}
                    className="text-xs font-medium text-primary"
                  >保存</button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditingId(tag.id); setEditingName(tag.name) }}
                    className="text-xs text-muted-foreground"
                  >重命名</button>
                )}
                <button
                  type="button"
                  onClick={() => run(() => archiveTag(tag.id), '标签已归档')}
                  className="text-xs text-muted-foreground"
                >归档</button>
              </div>
            ))}
            <Pagination
              page={activePage}
              pageCount={activePageCount}
              onPageChange={setActivePage}
              label="启用标签"
            />
          </div>
        )}
      </Card>

      {archived.length > 0 && (
        <Card className="rounded-xl px-4 py-2">
          <div className="border-b border-border py-2 text-xs font-medium text-muted-foreground">
            已归档标签
          </div>
          {visibleArchived.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
              <span className="text-sm text-muted-foreground">{tag.name}</span>
              <button
                type="button"
                onClick={() => run(() => restoreTag(tag.id), '标签已恢复')}
                className="text-xs font-medium text-primary"
              >恢复</button>
            </div>
          ))}
          <Pagination
            page={archivedPage}
            pageCount={archivedPageCount}
            onPageChange={setArchivedPage}
            label="已归档标签"
          />
        </Card>
      )}
      <Toast toast={toast} />
    </div>
  )
}

function Pagination({
  page,
  pageCount,
  onPageChange,
  label,
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  label: string
}) {
  if (pageCount <= 1) return null

  return (
    <nav
      aria-label={`${label}分页`}
      className="flex items-center justify-between border-t border-border pt-3"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
      >
        上一页
      </button>
      <span className="text-xs tabular-nums text-muted-foreground">
        {page} / {pageCount}
      </span>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
      >
        下一页
      </button>
    </nav>
  )
}
