import type { LoyaltyProgress } from './LoyaltyRewardsCard'

/** Display tier label for welcome banner badge. */
export function loyaltyTierLabel(loyalty: LoyaltyProgress): string {
  if (loyalty.isEligible && loyalty.qualifyingOrderCount >= 2) return 'GOLD PLUS'
  if (loyalty.isEligible) return 'GOLD'
  if (loyalty.progressPercent >= 50) return 'SILVER'
  return 'MEMBER'
}

export function loyaltyPointsDisplay(loyalty: LoyaltyProgress): number {
  return loyalty.qualifyingOrderCount * 100 + loyalty.progressPercent
}
