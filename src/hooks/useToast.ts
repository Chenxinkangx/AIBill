import { useCallback, useRef, useState } from 'react'
import type { ToastState } from '../components/common/Toast'

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timerRef = useRef<number | null>(null)

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    setToast({ type, message })
    timerRef.current = window.setTimeout(() => setToast(null), 3000)
  }, [])

  return { toast, showToast }
}
