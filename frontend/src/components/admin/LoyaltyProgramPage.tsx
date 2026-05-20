import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Gift,
  Loader2,
  RefreshCw,
  Users,
  Award,
  Sparkles,
} from 'lucide-react'
import {
  fetchLoyaltyProgramSummary,
  type LoyaltyProgramCustomerRow,
  type LoyaltyProgramSummary,
} from '../../services/loyaltyApi'
import { formatMoney } from '../../utils/formatUsd'

type Props = {
  onBack?: () => void
}

function tierBadgeClass(tier: string) {
  const t = tier.toUpperCase()
  if (t.includes('GOLD PLUS')) return 'bg-amber-100 text-amber-900 ring-amber-200'
  if (t.includes('GOLD')) return 'bg-yellow-50 text-yellow-800 ring-yellow-200'
  if (t.includes('SILVER')) return 'bg-slate-100 text-slate-700 ring-slate-200'
  return 'bg-blue-50 text-blue-700 ring-blue-200'
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${tierBadgeClass(tier)}`}
    >
      {tier}
    </span>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'blue' | 'emerald' | 'amber' | 'violet'
}) {
  const accentCls =
    accent === 'emerald'
      ? 'text-emerald-600'
      : accent === 'amber'
        ? 'text-amber-600'
        : accent === 'violet'
          ? 'text-violet-600'
          : 'text-blue-600'
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${accentCls}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  )
}

export function LoyaltyProgramPage({ onBack }: Props) {
  const [summary, setSummary] = useState<LoyaltyProgramSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'eligible'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchLoyaltyProgramSummary()
      setSummary(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load loyalty program data.')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(() => {
    if (!summary) return []
    if (filter === 'eligible') {
      return summary.customers.filter((c) => c.isEligible)
    }
    return summary.customers
  }, [summary, filter])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
      ) : null}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Gift className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Loyalty Program</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              {summary
                ? `${summary.discountPercent}% discount on single orders over ${formatMoney(summary.orderThreshold)}. Track enrolled customers and unlocked rewards.`
                : 'View how many customers have unlocked loyalty discounts and their tier status.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {loading && !summary ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading loyalty data…
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Customers with loyalty"
              value={String(summary.eligibleCustomers)}
              sub="Unlocked discount on qualifying orders"
              accent="emerald"
            />
            <StatCard
              label="Total customers"
              value={String(summary.totalCustomers)}
              sub="Registered in the program"
              accent="blue"
            />
            <StatCard
              label="Gold / Gold Plus"
              value={String(summary.goldCount + summary.goldPlusCount)}
              sub={`${summary.goldPlusCount} Gold Plus · ${summary.goldCount} Gold`}
              accent="amber"
            />
            <StatCard
              label="Silver tier"
              value={String(summary.silverCount)}
              sub={`${summary.memberCount} at Member tier`}
              accent="violet"
            />
          </div>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Customer loyalty roster</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {filter === 'eligible'
                    ? `Showing ${rows.length} customer${rows.length === 1 ? '' : 's'} with active loyalty`
                    : `Showing ${rows.length} customer${rows.length === 1 ? '' : 's'} with purchase history`}
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`rounded-md px-3 py-1.5 transition ${
                    filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All with purchases
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('eligible')}
                  className={`rounded-md px-3 py-1.5 transition ${
                    filter === 'eligible'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  With loyalty only
                </button>
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">
                {filter === 'eligible'
                  ? 'No customers have unlocked loyalty discounts yet.'
                  : 'No customers with purchase history yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-3 py-2.5">Tier</th>
                      <th className="px-3 py-2.5 text-right">Points</th>
                      <th className="px-3 py-2.5 text-right">Total spent</th>
                      <th className="px-3 py-2.5 text-center">Qualifying orders</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((row) => (
                      <CustomerRow key={row.customerId} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Gold Plus', count: summary.goldPlusCount, Icon: Sparkles, color: 'text-amber-600' },
              { label: 'Gold', count: summary.goldCount, Icon: Award, color: 'text-yellow-600' },
              { label: 'Silver', count: summary.silverCount, Icon: Users, color: 'text-slate-600' },
            ].map(({ label, count, Icon, color }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
              >
                <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="text-lg font-bold text-slate-900">{count}</p>
                </div>
              </div>
            ))}
          </section>
        </>
      ) : null}
    </div>
  )
}

function CustomerRow({ row }: { row: LoyaltyProgramCustomerRow }) {
  return (
    <tr className="transition hover:bg-slate-50/80">
      <td className="px-3 py-3">
        <p className="font-medium text-slate-900">{row.customerName}</p>
        {row.email ? <p className="text-xs text-slate-500">{row.email}</p> : null}
      </td>
      <td className="px-3 py-3">
        <TierBadge tier={row.tier} />
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-slate-700">
        {row.loyaltyPoints.toLocaleString()}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatMoney(row.totalSpent)}</td>
      <td className="px-3 py-3 text-center tabular-nums text-slate-700">{row.qualifyingOrderCount}</td>
      <td className="px-3 py-3">
        {row.isEligible ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
            Loyalty active
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            In progress
          </span>
        )}
      </td>
    </tr>
  )
}
