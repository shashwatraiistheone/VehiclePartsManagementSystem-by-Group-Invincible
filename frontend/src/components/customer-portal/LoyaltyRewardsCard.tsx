import { CheckCircleIcon, GiftIcon } from '@heroicons/react/24/outline'
import type { CustomerHistory } from '../../services/customerApi'
import { formatMoney } from './shared'

export const LOYALTY_ORDER_THRESHOLD = 5000
const LOYALTY_DISCOUNT_PERCENT = 10

export type LoyaltyProgress = {
  largestOrderSubtotal: number
  progressPercent: number
  remainingAmount: number
  isEligible: boolean
  qualifyingOrderCount: number
}

export function computeLoyaltyProgress(history: CustomerHistory): LoyaltyProgress {
  const subtotals = history.purchases.map((p) => p.totalAmount)
  const largestOrderSubtotal = subtotals.length > 0 ? Math.max(...subtotals) : 0
  const qualifyingOrderCount = subtotals.filter((t) => t >= LOYALTY_ORDER_THRESHOLD).length
  const hasDiscountApplied = history.purchases.some((p) => p.discount > 0)
  const isEligible = qualifyingOrderCount > 0 || hasDiscountApplied
  const progressPercent = Math.min(100, Math.round((largestOrderSubtotal / LOYALTY_ORDER_THRESHOLD) * 100))
  const remainingAmount = Math.max(0, LOYALTY_ORDER_THRESHOLD - largestOrderSubtotal)

  return {
    largestOrderSubtotal,
    progressPercent,
    remainingAmount,
    isEligible,
    qualifyingOrderCount,
  }
}

type Props = {
  history: CustomerHistory
}

export function LoyaltyRewardsCard({ history }: Props) {
  const { largestOrderSubtotal, progressPercent, remainingAmount, isEligible, qualifyingOrderCount } =
    computeLoyaltyProgress(history)

  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-500/20">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
          <GiftIcon className="h-5 w-5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight">Loyalty Rewards</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-blue-100/90">
            {LOYALTY_DISCOUNT_PERCENT}% discount on orders over {formatMoney(LOYALTY_ORDER_THRESHOLD)}
          </p>
        </div>
      </div>

      {isEligible ? (
        <div className="mt-4 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/30">
            <CheckCircleIcon className="h-4 w-4" />
            10% Discount Unlocked
          </div>
          <p className="text-sm leading-relaxed text-blue-50/95">
            {qualifyingOrderCount > 0
              ? `You've placed ${qualifyingOrderCount} qualifying order${qualifyingOrderCount > 1 ? 's' : ''} over ${formatMoney(LOYALTY_ORDER_THRESHOLD)}. Your next eligible order automatically receives ${LOYALTY_DISCOUNT_PERCENT}% off.`
              : `Congratulations! Your loyalty discount is active on single orders over ${formatMoney(LOYALTY_ORDER_THRESHOLD)}.`}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-emerald-300 transition-all duration-500"
              style={{ width: '100%' }}
            />
          </div>
          <p className="text-[11px] text-blue-100/80">
            Best order so far: {formatMoney(largestOrderSubtotal)}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-end justify-between gap-2 text-xs">
            <span className="text-blue-100/90">Progress toward reward</span>
            <span className="font-semibold tabular-nums">{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm font-medium text-white">
            {largestOrderSubtotal > 0
              ? `Spend ${formatMoney(remainingAmount)} more on a single order to unlock ${LOYALTY_DISCOUNT_PERCENT}% OFF`
              : `Place an order over ${formatMoney(LOYALTY_ORDER_THRESHOLD)} to unlock ${LOYALTY_DISCOUNT_PERCENT}% OFF`}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-[11px] ring-1 ring-white/15">
            <span className="text-blue-100/90">
              Best order: <span className="font-semibold text-white">{formatMoney(largestOrderSubtotal)}</span>
            </span>
            <span className="text-blue-100/90">
              Target: <span className="font-semibold text-white">{formatMoney(LOYALTY_ORDER_THRESHOLD)}</span>
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
