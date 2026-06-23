import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function PageContainer({ children }: Props) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 pt-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:max-w-3xl md:pb-6 lg:max-w-5xl">
      {children}
    </main>
  )
}
