import type { ReactNode } from 'react'

type Props = {
  title: string
  description: string
  children?: ReactNode
}

export function SectionPlaceholder({ title, description, children }: Props) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">{description}</p>
      {children ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div> : null}
    </div>
  )
}
