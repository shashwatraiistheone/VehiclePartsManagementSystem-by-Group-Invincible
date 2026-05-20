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
        'vms-card-hover flex w-full flex-col gap-3 p-5 text-left',
        'hover:border-primary-600/30',
        onClick ? 'cursor-pointer' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-500/20">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </Tag>
  )
}
