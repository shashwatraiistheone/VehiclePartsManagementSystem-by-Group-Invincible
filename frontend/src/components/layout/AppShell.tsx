import type { ReactNode } from 'react'

type Props = {
  sidebar: ReactNode
  children: ReactNode
}

export function AppShell({ sidebar, children }: Props) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-slate-50 transition-colors dark:bg-slate-950 max-md:flex-col md:flex-row">
      <div className="sticky top-0 z-30 shrink-0 self-start max-md:max-h-0 max-md:overflow-visible md:h-[100dvh]">
        {sidebar}
      </div>
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-14 sm:p-6 md:pt-6 lg:p-8">
        <div className="vms-page">{children}</div>
      </main>
    </div>
  )
}
