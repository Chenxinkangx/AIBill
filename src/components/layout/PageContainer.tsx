import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function PageContainer({ children }: Props) {
  return (
    <main className="min-h-screen pb-20 px-4 pt-4 max-w-lg mx-auto">
      {children}
    </main>
  )
}
