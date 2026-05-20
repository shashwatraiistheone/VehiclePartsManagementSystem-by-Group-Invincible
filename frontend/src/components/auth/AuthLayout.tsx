import type { ReactNode } from 'react'
import { APP_COPYRIGHT, APP_NAME, APP_TAGLINE } from '../../lib/appBranding'
import {
  ShieldCheckIcon,
  CubeIcon,
  PresentationChartLineIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    Icon: ShieldCheckIcon,
    title: 'Secure & Reliable',
    description: 'Protected access and audited authentication.',
  },
  {
    Icon: CubeIcon,
    title: 'Real-time Inventory',
    description: 'Parts and stock updates when your team makes changes.',
  },
  {
    Icon: PresentationChartLineIcon,
    title: 'Business Analytics',
    description: 'Dashboard insights for smarter ordering and sales.',
  },
] as const

export function AuthLayout(props: {
  children: ReactNode
  footer?: ReactNode
  brandTitle?: string
  brandSubtitle?: string
}) {
  return (
    <div className="grid min-h-screen min-h-[100dvh] grid-cols-1 lg:grid-cols-2">
      {/* Brand panel — exactly half width on desktop */}
      <aside className="relative order-2 flex min-h-[280px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1d4ed8] px-6 py-10 text-white sm:px-10 sm:py-12 lg:order-1 lg:min-h-screen lg:px-12 lg:py-14 xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,rgba(59,130,246,0.22),transparent_55%)]"
        />

        <div className="relative z-10 w-full max-w-lg">
          <div className="mb-8 flex items-center gap-3 sm:mb-10">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-blue-900/30 ring-1 ring-white/20 backdrop-blur-sm sm:h-12 sm:w-12">
              <WrenchScrewdriverIcon className="h-5 w-5 text-blue-100 sm:h-6 sm:w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
                {props.brandTitle ?? APP_NAME}
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-blue-200/80 sm:text-xs">
                {APP_TAGLINE}
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-blue-100/90 sm:text-base lg:text-lg">
            {props.brandSubtitle ??
              'Manage vehicle parts inventory, staff, and operations efficiently in one place.'}
          </p>
        </div>

        <ul className="relative z-10 mt-8 hidden w-full max-w-lg flex-col gap-3 lg:mt-0 lg:flex lg:gap-4">
          {features.map(({ Icon, title, description }) => (
            <li
              key={title}
              className="group flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 shadow-lg shadow-blue-950/20 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 sm:gap-4 sm:p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 sm:h-11 sm:w-11">
                <Icon className="h-5 w-5 text-blue-100 sm:h-6 sm:w-6" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-blue-100/80 sm:text-sm">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="relative z-10 mt-6 hidden text-xs text-blue-200/60 lg:block">
          {APP_COPYRIGHT}
        </p>
      </aside>

      {/* Form panel — equal half width on desktop */}
      <main className="order-1 flex min-h-0 min-w-0 flex-col bg-gradient-to-b from-slate-50 to-white lg:order-2 lg:min-h-screen lg:overflow-y-auto">
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-12 lg:px-10 xl:px-16">
          <div className="w-full min-w-0 max-w-md">{props.children}</div>
        </div>
        {props.footer ?? (
          <p className="shrink-0 pb-6 text-center text-xs text-slate-400 lg:hidden">
            {APP_COPYRIGHT}
          </p>
        )}
      </main>
    </div>
  )
}
