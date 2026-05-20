import { useCallback, useEffect, useState } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import {
  fetchCommunityReviewsFeed,
  type CommunityReview,
  type CommunityReviewStats,
} from '../../services/communityReviewApi'
import { formatDate } from './shared'
import { SubmitFeedbackModal } from './SubmitFeedbackModal'
import type { CustomerNavId } from './types'

type Props = {
  onNavigate: (navId: CustomerNavId) => void
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarSolid key={n} className={`h-4 w-4 ${n <= rating ? 'text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  )
}

function avatarInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1]?.[0] ?? ''}`.toUpperCase()
}

function ReviewCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="h-11 w-11 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-3 w-20 rounded bg-slate-100" />
          <div className="mt-3 h-12 w-full rounded bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-center shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

export function CommunityReviewsPage({ onNavigate: _onNavigate }: Props) {
  const [reviews, setReviews] = useState<CommunityReview[]>([])
  const [stats, setStats] = useState<CommunityReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    fiveStarPercentage: 0,
  })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const feed = await fetchCommunityReviewsFeed()
      setReviews(feed.reviews)
      setStats(feed.stats)
    } catch {
      setReviews([])
      setStats({ totalReviews: 0, averageRating: 0, fiveStarPercentage: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 px-6 py-12 text-center shadow-sm ring-1 ring-blue-100/80 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />

        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 shadow-inner ring-1 ring-violet-200/60">
          <ChatBubbleLeftRightIcon className="h-8 w-8" strokeWidth={1.5} />
        </div>

        <h1 className="relative mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Community Feedback
        </h1>
        <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
          What our customers are saying about our service, parts, and experience. Join the community!
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="relative mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
        >
          Leave Feedback
        </button>
      </section>

      {/* Stats */}
      {!loading && reviews.length > 0 ? (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total Reviews" value={String(stats.totalReviews)} />
          <StatCard label="Average Rating" value={stats.averageRating.toFixed(1)} />
          <StatCard label="5-Star %" value={`${stats.fiveStarPercentage}%`} />
        </section>
      ) : null}

      {/* Grid */}
      <section>
        {loading ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <ReviewCardSkeleton />
              </li>
            ))}
          </ul>
        ) : reviews.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <ChatBubbleLeftRightIcon className="h-10 w-10 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-700">No community feedback yet</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Be the first to share your experience. Reviews appear here after admin approval.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md"
            >
              Leave Feedback
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((r) => (
              <li key={r.id}>
                <article className="group flex h-full flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 text-sm font-bold text-violet-700 ring-2 ring-white">
                      {avatarInitials(r.customerName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{r.customerName}</p>
                      <ReviewStars rating={r.rating} />
                    </div>
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                    &ldquo;{r.reviewText}&rdquo;
                  </p>
                  <p className="mt-4 text-right text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SubmitFeedbackModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={() => void load()}
      />
    </div>
  )
}
