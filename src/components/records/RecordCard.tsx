import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { RecordItem, Category } from '../../types'
import { formatMoney } from '../../utils/money'
import RecordActions from './RecordActions'
import ConfirmDialog from '../common/ConfirmDialog'
import { deleteRecord } from '../../services/record/recordService'

interface Props {
  record: RecordItem
  categoryName: string
  categories: Category[]
  onUpdated: () => void
  onDeleted: () => void
}

export default function RecordCard({ record, categoryName, categories, onUpdated, onDeleted }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [swipeOpen, setSwipeOpen] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const currentDragX = useRef(0)
  const didSwipe = useRef(false)

  const createdTime = formatRecordTime(record.createdAt)
  const updatedTime = formatRecordTime(record.updatedAt)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    startX.current = event.clientX
    startY.current = event.clientY
    didSwipe.current = false
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (startX.current === null || startY.current === null) return

    const deltaX = event.clientX - startX.current
    const deltaY = event.clientY - startY.current

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 12) {
      return
    }

    if (deltaX < -8 || (swipeOpen && deltaX > 8)) {
      didSwipe.current = true
      const nextDragX = Math.max(-88, Math.min(0, swipeOpen ? -88 + deltaX : deltaX))
      currentDragX.current = nextDragX
      setDragX(nextDragX)
    }
  }

  const handlePointerUp = () => {
    if (startX.current === null) return
    setSwipeOpen(currentDragX.current < -44)
    currentDragX.current = 0
    setDragX(0)
    startX.current = null
    startY.current = null
  }

  const handleCardClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    if (swipeOpen) {
      setSwipeOpen(false)
      return
    }
    setExpanded((value) => !value)
  }

  const handleDelete = async () => {
    setDeleteError('')
    try {
      await deleteRecord(record.id)
      setDeleting(false)
      setSwipeOpen(false)
      onDeleted()
    } catch {
      setDeleteError('删除失败，请重试')
      setDeleting(false)
    }
  }

  const offset = swipeOpen ? -88 : dragX

  return (
    <div className="relative overflow-hidden border-b border-gray-100 last:border-b-0">
      <div className="absolute inset-y-0 right-0 flex w-[88px] items-stretch justify-end bg-red-500">
        <button
          onClick={() => setDeleting(true)}
          className="w-full text-sm font-medium text-white"
        >
          删除
        </button>
      </div>

      <div
        className="relative touch-pan-y bg-white px-4 py-3 transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm">
              {record.type === 'income' ? '入' : '出'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {record.title}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                <span className="truncate">{categoryName}</span>
                {createdTime && (
                  <>
                    <span>·</span>
                    <span>{createdTime}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span
              className={`text-sm font-semibold ${
                record.type === 'income' ? 'text-green-600' : 'text-gray-900'
              }`}
            >
              {record.type === 'income' ? '+' : '-'}
              {formatMoney(record.amount)}
            </span>
            <span className="text-xs text-gray-300">{expanded ? '收起' : '详情'}</span>
          </div>
        </div>

        {expanded && (
          <div
            className="mt-3 ml-11 space-y-2 rounded-2xl bg-gray-50 px-3 py-3 text-xs text-gray-500"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-2">
              <Detail label="类型" value={record.type === 'income' ? '收入' : '支出'} />
              <Detail label="分类" value={categoryName} />
              <Detail label="日期" value={record.date} />
              {createdTime && <Detail label="创建时间" value={createdTime} />}
              {updatedTime && updatedTime !== createdTime && (
                <Detail label="更新时间" value={updatedTime} />
              )}
            </div>
            {record.note && (
              <div>
                <span className="text-gray-400">备注</span>
                <p className="mt-1 text-gray-700">{record.note}</p>
              </div>
            )}
            {deleteError && <p className="text-red-500">{deleteError}</p>}
            <RecordActions
              record={record}
              categories={categories}
              onUpdated={onUpdated}
              onDeleted={onDeleted}
              showDeleteAction={false}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleting}
        title="删除账单"
        message="确定删除这条账单吗？删除后预算会自动重新计算。"
        confirmLabel="删除"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleting(false)}
      />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400">{label}</span>
      <p className="mt-0.5 font-medium text-gray-700">{value}</p>
    </div>
  )
}

function formatRecordTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
