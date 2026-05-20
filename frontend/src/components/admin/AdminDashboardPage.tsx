import type { AdminPageId } from '../../admin/adminPages'
import { AdminInsightsDashboard } from './dashboard/AdminInsightsDashboard'

type Props = {
  onNavigate: (id: AdminPageId) => void
}

export function AdminDashboardPage({ onNavigate }: Props) {
  return <AdminInsightsDashboard onNavigate={onNavigate} />
}
