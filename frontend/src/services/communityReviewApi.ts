import axios from 'axios'
import { api, extractApiErrorMessage } from '../lib/apiClient'
import { fetchApprovedReviews, type Review } from './reviewApi'

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

export const DAILY_REVIEW_LIMIT_MESSAGE = 'You have already submitted a review today.'

export type CommunityReview = {
  id: number
  customerId: number
  customerName: string
  rating: number
  reviewText: string
  status: string
  createdAt: string
}

export type CommunityReviewStats = {
  totalReviews: number
  averageRating: number
  fiveStarPercentage: number
}

export type CommunityReviewsFeed = {
  reviews: CommunityReview[]
  stats: CommunityReviewStats
}

function mapLegacyReview(r: Review): CommunityReview {
  return {
    id: r.id,
    customerId: r.customerId,
    customerName: r.customerName,
    rating: r.rating,
    reviewText: r.comment,
    status: r.status,
    createdAt: r.createdAt,
  }
}

function buildStatsFromReviews(reviews: CommunityReview[]): CommunityReviewStats {
  if (reviews.length === 0) {
    return { totalReviews: 0, averageRating: 0, fiveStarPercentage: 0 }
  }
  const sum = reviews.reduce((a, r) => a + r.rating, 0)
  const fiveStar = reviews.filter((r) => r.rating === 5).length
  return {
    totalReviews: reviews.length,
    averageRating: Math.round((sum / reviews.length) * 10) / 10,
    fiveStarPercentage: Math.round((fiveStar * 100) / reviews.length),
  }
}

function normalizeFeed(data: Record<string, unknown>): CommunityReviewsFeed {
  const reviewsRaw = (data.reviews ?? data.Reviews ?? []) as Record<string, unknown>[]
  const statsRaw = (data.stats ?? data.Stats ?? {}) as Record<string, unknown>
  const reviews = reviewsRaw.map((r) => ({
    id: Number(r.id ?? r.Id ?? 0),
    customerId: Number(r.customerId ?? r.CustomerId ?? 0),
    customerName: String(r.customerName ?? r.CustomerName ?? ''),
    rating: Number(r.rating ?? r.Rating ?? 0),
    reviewText: String(r.reviewText ?? r.ReviewText ?? r.comment ?? r.Comment ?? ''),
    status: String(r.status ?? r.Status ?? 'Approved'),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
  }))
  return {
    reviews,
    stats: {
      totalReviews: Number(statsRaw.totalReviews ?? statsRaw.TotalReviews ?? reviews.length),
      averageRating: Number(statsRaw.averageRating ?? statsRaw.AverageRating ?? 0),
      fiveStarPercentage: Number(statsRaw.fiveStarPercentage ?? statsRaw.FiveStarPercentage ?? 0),
    },
  }
}

export async function fetchCommunityReviewsFeed(): Promise<CommunityReviewsFeed> {
  try {
    const { data } = await api.get<Record<string, unknown>>('/api/community-reviews')
    return normalizeFeed(data)
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      const legacy = await fetchApprovedReviews()
      const reviews = legacy.map(mapLegacyReview)
      return { reviews, stats: buildStatsFromReviews(reviews) }
    }
    throw new Error(extractError(e))
  }
}

export async function fetchAllCommunityReviews(): Promise<CommunityReview[]> {
  try {
    const { data } = await api.get<Record<string, unknown>[]>('/api/community-reviews/all')
    return data.map((r) => ({
      id: Number(r.id ?? r.Id ?? 0),
      customerId: Number(r.customerId ?? r.CustomerId ?? 0),
      customerName: String(r.customerName ?? r.CustomerName ?? ''),
      rating: Number(r.rating ?? r.Rating ?? 0),
      reviewText: String(r.reviewText ?? r.ReviewText ?? ''),
      status: String(r.status ?? r.Status ?? 'Pending'),
      createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
    }))
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function createCommunityReview(payload: {
  rating: number
  reviewText: string
}): Promise<CommunityReview> {
  try {
    const { data } = await api.post<Record<string, unknown>>('/api/community-reviews', payload)
    return {
      id: Number(data.id ?? data.Id ?? 0),
      customerId: Number(data.customerId ?? data.CustomerId ?? 0),
      customerName: String(data.customerName ?? data.CustomerName ?? ''),
      rating: Number(data.rating ?? data.Rating ?? payload.rating),
      reviewText: String(data.reviewText ?? data.ReviewText ?? payload.reviewText),
      status: String(data.status ?? data.Status ?? 'Pending'),
      createdAt: String(data.createdAt ?? data.CreatedAt ?? new Date().toISOString()),
    }
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function updateCommunityReviewStatus(
  id: number,
  status: string,
): Promise<CommunityReview> {
  try {
    const { data } = await api.patch<Record<string, unknown>>(`/api/community-reviews/${id}/status`, {
      status,
    })
    return {
      id: Number(data.id ?? data.Id ?? id),
      customerId: Number(data.customerId ?? data.CustomerId ?? 0),
      customerName: String(data.customerName ?? data.CustomerName ?? ''),
      rating: Number(data.rating ?? data.Rating ?? 0),
      reviewText: String(data.reviewText ?? data.ReviewText ?? ''),
      status: String(data.status ?? data.Status ?? status),
      createdAt: String(data.createdAt ?? data.CreatedAt ?? ''),
    }
  } catch (e) {
    throw new Error(extractError(e))
  }
}
