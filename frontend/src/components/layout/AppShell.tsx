import type { ReactNode } from 'react'

type Props = {
  sidebar: ReactNode
  children: ReactNode
}

export function AppShell({ sidebar, children }: Props) {
  return (
    <div className="flex min-h-screen w-full max-w-full flex-col bg-gray-100 md:flex-row">
      {sidebar}
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}
