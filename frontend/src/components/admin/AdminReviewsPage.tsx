import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  Search,
  Star,
  XCircle,
} from 'lucide-react'
import {
  fetchAllCommunityReviews,
  updateCommunityReviewStatus,
  type CommunityReview,
} from '../../services/communityReviewApi'
import {
  fetchAllReviews,
  updateReviewStatus,
  type Review,
} from '../../services/reviewApi'
import { useToast } from '../ui/ToastProvider'
import { reviewStatusClass, reviewStatusLabel } from '../customer-portal/reviewDisplay'
import { formatDate } from '../customer-portal/shared'

type ReviewRow = {
  id: number
  customerName: string
  rating: number
  text: string
  status: string
  createdAt: string
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

const PAGE_SIZE = 6

const DEMO_REVIEWS: ReviewRow[] = [
  {
    id: 1,
    customerName: 'Matthew Stewart',
    rating: 5,
    text: 'The brake service was excellent and very professional.',
    status: 'Pending',
    createdAt: '2026-08-12T10:30:00Z',
  },
  {
    id: 2,
    customerName: 'Paul Bailey',
    rating: 4,
    text: 'Fast delivery and quality parts.',
    status: 'Pending',
    createdAt: '2026-08-11T14:20:00Z',
  },
  {
    id: 3,
    customerName: 'Daniel Fox',
    rating: 5,
    text: 'Very satisfied with the engine repair service.',
    status: 'Pending',
    createdAt: '2026-08-10T09:15:00Z',
  },
  {
    id: 4,
    customerName: 'Wanda Johnson',
    rating: 4,
    text: 'Customer support was very responsive and helpful.',
    status: 'Pending',
    createdAt: '2026-08-09T16:45:00Z',
  },
  {
    id: 5,
    customerName: 'Mary Roberts',
    rating: 5,
    text: 'Outstanding workshop experience from start to finish.',
    status: 'Pending',
    createdAt: '2026-08-08T11:00:00Z',
  },
  {
    id: 6,
    customerName: 'Betty White',
    rating: 4,
    text: 'Great value and honest pricing on replacement parts.',
    status: 'Pending',
    createdAt: '2026-08-07T13:30:00Z',
  },
  {
    id: 7,
    customerName: 'Chloe Scott',
    rating: 5,
    text: 'Technicians explained everything clearly. Highly recommend.',
    status: 'Pending',
    createdAt: '2026-08-06T08:50:00Z',
  },
  {
    id: 8,
    customerName: 'Lisa Turner',
    rating: 3,
    text: 'Service was good but wait time was longer than expected.',
    status: 'Approved',
    createdAt: '2026-08-05T15:10:00Z',
  },
  {
    id: 9,
    customerName: 'James Cole',
    rating: 2,
    text: 'Parts arrived late for my scheduled appointment.',
    status: 'Rejected',
    createdAt: '2026-08-04T12:00:00Z',
  },
]

function mapCommunity(r: CommunityReview): ReviewRow {
  return {
    id: r.id,
    customerName: r.customerName,
    rating: r.rating,
    text: r.reviewText,
    status: r.status,
    createdAt: r.createdAt,
  }
}

function mapLegacy(r: Review): ReviewRow {
  return {
    id: r.id,
    customerName: r.customerName,
    rating: r.rating,
    text: r.comment,
    status: r.status,
    createdAt: r.createdAt,
  }
}

function normalizeStatus(status: string): StatusFilter | 'other' {
  const s = status.toLowerCase()
  if (s === 'pending') return 'pending'
  if (s === 'approved') return 'approved'
  if (s === 'rejected') return 'rejected'
  return 'other'
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={[
            'h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]',
            n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

function ReviewCardSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-4 animate-pulse rounded bg-slate-200" />
        ))}
      </div>
      <div className="mt-4 h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-3 w-20 animate-pulse rounded bg-slate-100" />
      <div className="mt-4 h-12 w-full animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-5 flex gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-full bg-slate-100" />
        <div className="h-9 flex-1 animate-pulse rounded-full bg-slate-100" />
      </div>
    </article>
  )
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'slate' | 'amber' | 'emerald' | 'rose'
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    rose: 'bg-rose-50 text-rose-800 ring-rose-200',
  }
  return (
    <div className={`rounded-xl px-4 py-3 ring-1 ${tones[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 text-xl font-bold">{value}</p>
    </div>
  )
}

function ReviewModerationCard({
  review,
  updating,
  onApprove,
  onReject,
  onViewDetails,
  index,
  mounted,
}: {
  review: ReviewRow
  updating: boolean
  onApprove: () => void
  onReject: () => void
  onViewDetails: () => void
  index: number
  mounted: boolean
}) {
  const isPending = review.status.toLowerCase() === 'pending'

  return (
    <article
      className={[
        'flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6',
        'transition-all duration-500 ease-out hover:-translate-y-1 hover:border-blue-200/60 hover:shadow-lg',
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
      ].join(' ')}
      style={{ transitionDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <StarRating rating={review.rating} />
        <span
          className={[
            'inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
            reviewStatusClass(review.status),
          ].join(' ')}
        >
          {reviewStatusLabel(review.status)}
        </span>
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900">{review.customerName}</h3>
      <p className="mt-1 text-xs text-slate-500">{formatDate(review.createdAt)}</p>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
        &ldquo;{review.text}&rdquo;
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {isPending ? (
          <>
            <button
              type="button"
              disabled={updating}
              onClick={onApprove}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-60"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={onReject}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-60"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={onViewDetails}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white hover:shadow-sm"
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>
      </div>
    </article>
  )
}

export function AdminReviewsPage() {
  const { showToast } = useToast()
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [useLegacyApi, setUseLegacyApi] = useState(false)
  const [useDemoData, setUseDemoData] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [detailReview, setDetailReview] = useState<ReviewRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAllCommunityReviews()
      if (data.length === 0) {
        setReviews(DEMO_REVIEWS)
        setUseDemoData(true)
      } else {
        setReviews(data.map(mapCommunity))
        setUseDemoData(false)
      }
      setUseLegacyApi(false)
    } catch {
      try {
        const legacy = await fetchAllReviews()
        if (legacy.length === 0) {
          setReviews(DEMO_REVIEWS)
          setUseDemoData(true)
        } else {
          setReviews(legacy.map(mapLegacy))
          setUseDemoData(false)
        }
        setUseLegacyApi(true)
      } catch {
        setReviews(DEMO_REVIEWS)
        setUseDemoData(true)
        setUseLegacyApi(false)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [load])

  const stats = useMemo(() => {
    const pending = reviews.filter((r) => normalizeStatus(r.status) === 'pending').length
    const approved = reviews.filter((r) => normalizeStatus(r.status) === 'approved').length
    const rejected = reviews.filter((r) => normalizeStatus(r.status) === 'rejected').length
    return { total: reviews.length, pending, approved, rejected }
  }, [reviews])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = [...reviews]
    if (statusFilter !== 'all') {
      list = list.filter((r) => normalizeStatus(r.status) === statusFilter)
    }
    if (q) {
      list = list.filter(
        (r) => r.customerName.toLowerCase().includes(q) || r.text.toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return list
  }, [reviews, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageReviews = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  async function setStatus(id: number, status: string) {
    setUpdatingId(id)
    try {
      if (useDemoData) {
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      } else if (useLegacyApi) {
        await updateReviewStatus(id, status)
        await load()
      } else {
        await updateCommunityReviewStatus(id, status)
        await load()
      }
      showToast(
        status === 'Approved'
          ? 'Review approved — it will appear in Community Reviews.'
          : `Review ${status.toLowerCase()}.`,
        'success',
      )
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const filterTabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="min-h-full bg-slate-50/80 pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-1 sm:px-2">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Community Moderation
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
              Review pending customer feedback before it goes public.
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-900 shadow-md shadow-amber-200/50 ring-1 ring-amber-200/80">
            <Clock className="h-4 w-4" />
            {stats.pending} Pending Reviews
          </span>
        </header>

        {/* Stats summary */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="Total" value={stats.total} tone="slate" />
          <StatPill label="Pending" value={stats.pending} tone="amber" />
          <StatPill label="Approved" value={stats.approved} tone="emerald" />
          <StatPill label="Rejected" value={stats.rejected} tone="rose" />
        </section>

        {/* Search & filters */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or review…"
              className="w-full rounded-full border border-slate-200 bg-slate-100/80 py-2.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={[
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Review grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ReviewCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-600">No reviews match your filters.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pageReviews.map((r, index) => (
              <ReviewModerationCard
                key={r.id}
                review={r}
                updating={updatingId === r.id}
                index={index}
                mounted={mounted}
                onApprove={() => void setStatus(r.id, 'Approved')}
                onReject={() => void setStatus(r.id, 'Rejected')}
                onViewDetails={() => setDetailReview(r)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 ? (
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm sm:flex-row">
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages}
              <span className="mx-2 text-slate-300">·</span>
              {filtered.length} review{filtered.length === 1 ? '' : 's'}
              <span className="mx-2 text-slate-300">·</span>
              Sorted by newest
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={[
                    'flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-semibold transition',
                    page === n
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {useDemoData && !loading ? (
          <p className="text-center text-xs text-slate-400">
            Showing demo moderation data — connect the API to load live customer reviews.
          </p>
        ) : null}
      </div>

      {/* Detail modal */}
      {detailReview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setDetailReview(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <StarRating rating={detailReview.rating} />
            <h2 className="mt-4 text-lg font-bold text-slate-900">{detailReview.customerName}</h2>
            <p className="mt-1 text-sm text-slate-500">{formatDate(detailReview.createdAt)}</p>
            <span
              className={[
                'mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
                reviewStatusClass(detailReview.status),
              ].join(' ')}
            >
              {reviewStatusLabel(detailReview.status)}
            </span>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">&ldquo;{detailReview.text}&rdquo;</p>
            <button
              type="button"
              onClick={() => setDetailReview(null)}
              className="mt-6 w-full rounded-full bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
