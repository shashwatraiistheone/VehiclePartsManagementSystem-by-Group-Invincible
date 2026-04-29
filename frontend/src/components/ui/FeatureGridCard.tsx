import type { ComponentType, SVGProps } from 'react'

type Props = {
  title: string
  description: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  onClick?: () => void
}

export function FeatureGridCard({ title, description, Icon, onClick }: Props) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={[
        'flex w-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm',
        'transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md',
        onClick ? 'cursor-pointer' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-500/20">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
    </Tag>
  )
}
