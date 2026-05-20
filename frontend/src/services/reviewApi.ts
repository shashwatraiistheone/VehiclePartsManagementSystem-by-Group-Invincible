import { api } from '../lib/apiClient'

export type Review = {
  id: number
  customerId: number
  customerName: string
  rating: number
  title?: string | null
  comment: string
  serviceType?: string | null
  status: string
  createdAt: string
}

export async function fetchAllReviews(): Promise<Review[]> {
  const { data } = await api.get<Review[]>('/api/reviews')
  return data
}

export async function fetchApprovedReviews(): Promise<Review[]> {
  const { data } = await api.get<Review[]>('/api/reviews/approved')
  return data
}

export async function fetchMyReviews(): Promise<Review[]> {
  const { data } = await api.get<Review[]>('/api/reviews/my')
  return data
}

export async function createReview(payload: {
  rating: number
  comment: string
  title?: string
  serviceType?: string
}): Promise<Review> {
  const { data } = await api.post<Review>('/api/reviews', payload)
  return data
}

export async function updateReviewStatus(reviewId: number, status: string): Promise<Review> {
  const { data } = await api.patch<Review>(`/api/reviews/${reviewId}/status`, { status })
  return data
}
