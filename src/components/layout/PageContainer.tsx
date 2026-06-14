import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function PageContainer({ children }: Props) {
  return (
    <main className="min-h-screen px-4 pt-5 max-w-lg mx-auto pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
      {children}
    </main>
  )
}
