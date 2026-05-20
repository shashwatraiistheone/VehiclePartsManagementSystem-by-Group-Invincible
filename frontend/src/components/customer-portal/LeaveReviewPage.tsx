import { useState } from 'react'
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid'
import { createCommunityReview } from '../../services/communityReviewApi'
import { useToast } from '../ui/ToastProvider'
import { StarRatingInput } from './StarRatingInput'
import type { CustomerNavId } from './types'

type Props = {
  onNavigate: (navId: CustomerNavId) => void
}

export function LeaveReviewPage({ onNavigate }: Props) {
  const { showToast } = useToast()
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError(null)

    const trimmed = reviewText.trim()
    if (trimmed.length < 3) {
      setFieldError('Please enter at least 3 characters of feedback.')
      return
    }

    setSubmitting(true)
    try {
      await createCommunityReview({ rating, reviewText: trimmed })
      setReviewText('')
      setRating(5)
      setSubmitted(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review'
      setFieldError(msg)
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <article className="mx-auto max-w-md rounded-2xl border border-slate-200/90 bg-white px-6 py-8 shadow-lg shadow-slate-200/60 sm:px-8 sm:py-10">
        {submitted ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-emerald-200/80">
              <CheckCircleIcon className="h-9 w-9 text-emerald-600" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Thank you for your review!</h1>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                Your feedback was submitted successfully. Once approved by our team, it will appear in
                the community feed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('community-reviews')}
              className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-700 hover:to-blue-600"
            >
              Back to Community Feedback
            </button>
          </div>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100 shadow-inner ring-1 ring-amber-200/60">
              <StarIcon className="h-8 w-8 text-amber-500" aria-hidden />
            </div>

            <div className="mt-5 text-center">
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Share Your Experience</h1>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                Sign in to submit feedback. One review per day. Approved reviews appear in the community
                feed.
              </p>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-7 space-y-5">
              <div>
                <StarRatingInput value={rating} onChange={setRating} centered />
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Your Feedback</span>
                <textarea
                  value={reviewText}
                  onChange={(e) => {
                    setReviewText(e.target.value)
                    setFieldError(null)
                  }}
                  rows={5}
                  disabled={submitting}
                  placeholder="Tell us about your experience..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-400/20 disabled:bg-slate-50"
                />
              </label>

              {fieldError ? (
                <p className="text-center text-xs font-medium text-red-600" role="alert">
                  {fieldError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('community-reviews')}
                className="mx-auto block text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                Back to Community Feedback
              </button>
            </form>
          </>
        )}
      </article>
    </div>
  )
}
