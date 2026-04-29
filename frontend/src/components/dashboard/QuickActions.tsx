import { CubeIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

const actions = [
  { id: 'parts' as const, label: 'Add Part', sub: 'Catalogue new inventory', icon: CubeIcon },
  { id: 'customers' as const, label: 'Add Customer', sub: 'Onboard a buyer', icon: UserGroupIcon },
  { id: 'sales' as const, label: 'Create Invoice', sub: 'New sale record', icon: DocumentTextIcon },
] as const

type Props = {
  onAction: (id: (typeof actions)[number]['id']) => void
}

export function QuickActions({ onAction }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Quick actions
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map(({ id, label, sub, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onAction(id)}
            className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <Icon className="h-6 w-6 text-blue-600 transition group-hover:scale-105" />
            <span className="mt-2 font-semibold text-slate-900">{label}</span>
            <span className="text-xs text-slate-500">{sub}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
