export type CustomerTab =
  | 'home'
  | 'insights'
  | 'profile'
  | 'vehicles'
  | 'purchases'
  | 'services'
  | 'appointments'
  | 'requests'
  | 'reviews'
  | 'community-reviews'
  | 'notifications'
  | 'ai'

/** Unique sidebar item id (multiple items may map to the same tab). */
export type CustomerNavId =
  | 'home'
  | 'dashboard'
  | 'profile-vehicles'
  | 'add-vehicle'
  | 'purchase-history'
  | 'service-records'
  | 'book-service'
  | 'my-appointments'
  | 'request-part'
  | 'my-part-requests'
  | 'ai-suggestions'
  | 'leave-review'
  | 'community-reviews'
  | 'notifications'

export type NavSelection = {
  navId: CustomerNavId
  tab: CustomerTab
}

export const NAV_SELECTIONS: Record<CustomerNavId, NavSelection> = {
  home: { navId: 'home', tab: 'home' },
  dashboard: { navId: 'dashboard', tab: 'insights' },
  'profile-vehicles': { navId: 'profile-vehicles', tab: 'profile' },
  'add-vehicle': { navId: 'add-vehicle', tab: 'vehicles' },
  'purchase-history': { navId: 'purchase-history', tab: 'purchases' },
  'service-records': { navId: 'service-records', tab: 'services' },
  'book-service': { navId: 'book-service', tab: 'appointments' },
  'my-appointments': { navId: 'my-appointments', tab: 'appointments' },
  'request-part': { navId: 'request-part', tab: 'requests' },
  'my-part-requests': { navId: 'my-part-requests', tab: 'requests' },
  'ai-suggestions': { navId: 'ai-suggestions', tab: 'ai' },
  'leave-review': { navId: 'leave-review', tab: 'reviews' },
  'community-reviews': { navId: 'community-reviews', tab: 'community-reviews' },
  notifications: { navId: 'notifications', tab: 'notifications' },
}

export function navIdForTab(tab: CustomerTab): CustomerNavId {
  const entry = Object.values(NAV_SELECTIONS).find((s) => s.tab === tab)
  return entry?.navId ?? 'home'
}

export type PortalData = {
  reload: () => Promise<void>
}
