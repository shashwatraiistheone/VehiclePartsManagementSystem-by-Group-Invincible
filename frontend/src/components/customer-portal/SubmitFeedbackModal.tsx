import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createCommunityReview } from '../../services/communityReviewApi'
import { useToast } from '../ui/ToastProvider'
import { StarRatingInput } from './StarRatingInput'

type Props = {
  open: boolean
  onClose: () => void
  onSubmitted: () => void
}

export function SubmitFeedbackModal({ open, onClose, onSubmitted }: Props) {
  const { showToast } = useToast()
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = reviewText.trim()
    if (trimmed.length < 3) {
      setError('Please enter at least 3 characters of feedback.')
      return
    }

    setSubmitting(true)
    try {
      await createCommunityReview({ rating, reviewText: trimmed })
      setReviewText('')
      setRating(5)
      showToast('Thank you! Your feedback was submitted and is pending admin approval.', 'success')
      onSubmitted()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit feedback'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <article className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-slate-200/90 bg-white px-6 py-8 shadow-2xl sm:px-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100 shadow-inner ring-1 ring-amber-200/60">
          <StarIcon className="h-8 w-8 text-amber-500" aria-hidden />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Share Your Experience</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
            Sign in to submit feedback. One review per day. Approved reviews appear in the community
            feed.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-7 space-y-5">
          <div>
            <p className="mb-2 text-center text-xs font-semibold text-slate-600">Star Rating</p>
            <StarRatingInput value={rating} onChange={setRating} centered />
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Your Feedback</span>
            <textarea
              value={reviewText}
              onChange={(e) => {
                setReviewText(e.target.value)
                setError(null)
              }}
              rows={5}
              disabled={submitting}
              placeholder="Tell us about your experience..."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-400/20 disabled:bg-slate-50"
            />
          </label>

          {error ? (
            <p className="text-center text-xs font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </article>
    </div>
  )
}
