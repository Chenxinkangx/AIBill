interface ToastState {
  type: 'success' | 'error'
  message: string
}

interface Props {
  toast: ToastState | null
}

export type { ToastState }

export default function Toast({ toast }: Props) {
  if (!toast) return null

  return (
    <div
      className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 text-sm px-6 py-2.5 rounded-full shadow-lg ${
        toast.type === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      {toast.message}
    </div>
  )
}
