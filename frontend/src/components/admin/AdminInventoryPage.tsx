import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
} from 'lucide-react'
import { LowStockAlertsDropdown } from './LowStockAlertsDropdown'
import { fetchUnreadCount } from '../../services/inventoryNotificationsApi'
import { PartDeactivateDialog } from './PartDeactivateDialog'
import { PartDeleteDialog } from './PartDeleteDialog'
import { PartFormModal } from './PartFormModal'
import { PartViewModal } from './PartViewModal'
import { useToast } from '../ui/ToastProvider'
import {
  deactivatePart,
  deletePart,
  fetchParts,
  isLowStock,
  stockLevelLabel,
  updatePart,
  type InventoryPart,
  type PartPayload,
} from '../../services/partsApi'

const PAGE_SIZES = [10, 25, 50, 100] as const

const HIGHLIGHT_DURATION_MS = 5000

type Props = {
  highlightPartId?: number | null
  focusPartOnly?: boolean
  onViewAllNotifications?: () => void
  onNavigateCreate?: () => void
  onClearHighlight?: () => void
  showCreatedToast?: boolean
  onDismissCreatedToast?: () => void
}

export function AdminInventoryPage({
  highlightPartId = null,
  focusPartOnly = false,
  onViewAllNotifications,
  onNavigateCreate,
  onClearHighlight,
  showCreatedToast,
  onDismissCreatedToast,
}: Props) {
  const { showToast } = useToast()
  const [parts, setParts] = useState<InventoryPart[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState(1)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<InventoryPart | null>(null)
  const [viewing, setViewing] = useState<InventoryPart | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<InventoryPart | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InventoryPart | null>(null)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [alertBadge, setAlertBadge] = useState(0)
  const [saving, setSaving] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeHighlightId, setActiveHighlightId] = useState<number | null>(null)
  const [flashStockPartId, setFlashStockPartId] = useState<number | null>(null)
  const [filterToPartId, setFilterToPartId] = useState<number | null>(null)
  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setParts(await fetchParts())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load parts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!showCreatedToast) return
    showToast('Part created successfully.', 'success')
    onDismissCreatedToast?.()
  }, [showCreatedToast, showToast, onDismissCreatedToast])

  useEffect(() => {
    void fetchUnreadCount()
      .then(setAlertBadge)
      .catch(() => {
        setAlertBadge(parts.filter((p) => p.isActive && isLowStock(p.quantity, p.criticalStockLevel)).length)
      })
  }, [parts])

  useEffect(() => {
    setPage(1)
  }, [search, categoryFilter, vendorFilter, lowStockOnly, pageSize])

  const categories = useMemo(() => {
    const set = new Set(parts.map((p) => p.category).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [parts])

  const vendors = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of parts) {
      if (p.vendorName && p.vendorName !== '—') map.set(p.vendorName, p.vendorName)
    }
    return ['all', ...Array.from(map.keys()).sort()]
  }, [parts])

  const lowStockCount = useMemo(
    () =>
      parts.filter((p) => p.isActive && isLowStock(p.quantity, p.criticalStockLevel)).length,
    [parts],
  )

  const hasCriticalStock = useMemo(
    () => parts.some((p) => p.isActive && p.quantity <= 0),
    [parts],
  )

  const badgeCount = alertBadge > 0 ? alertBadge : lowStockCount

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return parts.filter((p) => {
      if (filterToPartId != null && p.id !== filterToPartId) return false
      if (lowStockOnly && !isLowStock(p.quantity, p.criticalStockLevel)) return false
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (vendorFilter !== 'all' && p.vendorName !== vendorFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.partNumber.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q)
      )
    })
  }, [parts, search, categoryFilter, vendorFilter, lowStockOnly, filterToPartId])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const focusPart = useCallback(
    (partId: number, options?: { filterOnly?: boolean }) => {
      const part = parts.find((p) => p.id === partId)
      if (!part) return

      setSearch('')
      setCategoryFilter('all')
      setVendorFilter('all')
      setLowStockOnly(false)
      setFilterToPartId(options?.filterOnly ? partId : null)
      setActiveHighlightId(partId)
      setFlashStockPartId(partId)

      setPage(1)
    },
    [parts, pageSize],
  )

  useEffect(() => {
    if (!highlightPartId || loading) return
    focusPart(highlightPartId, { filterOnly: focusPartOnly })

    const scrollTimer = window.setTimeout(() => {
      rowRefs.current[highlightPartId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 450)

    const clearTimer = window.setTimeout(() => {
      setActiveHighlightId(null)
      setFlashStockPartId(null)
      setFilterToPartId(null)
      onClearHighlight?.()
    }, HIGHLIGHT_DURATION_MS)

    return () => {
      window.clearTimeout(scrollTimer)
      window.clearTimeout(clearTimer)
    }
  }, [highlightPartId, focusPartOnly, loading, focusPart, onClearHighlight])

  useEffect(() => {
    if (!activeHighlightId || filterToPartId != null) return
    const idx = filtered.findIndex((p) => p.id === activeHighlightId)
    if (idx >= 0) setPage(Math.floor(idx / pageSize) + 1)
  }, [activeHighlightId, filtered, pageSize, filterToPartId])

  useEffect(() => {
    if (!activeHighlightId || loading) return
    const scrollTimer = window.setTimeout(() => {
      rowRefs.current[activeHighlightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
    return () => window.clearTimeout(scrollTimer)
  }, [activeHighlightId, loading, page, pageRows])

  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, safePage - 2)
    const end = Math.min(totalPages, start + maxVisible - 1)
    start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }, [safePage, totalPages])

  async function handleSave(payload: PartPayload) {
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await updatePart(editing.id, payload)
        showToast('Part updated successfully.', 'success')
      }
      setFormMode(null)
      setEditing(null)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return
    setDeactivating(true)
    try {
      await deactivatePart(deactivateTarget.id, deactivateTarget)
      showToast(`${deactivateTarget.name} deactivated.`, 'success')
      setDeactivateTarget(null)
      await load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Deactivate failed', 'error')
    } finally {
      setDeactivating(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePart(deleteTarget.id)
      showToast(`${deleteTarget.name} deleted.`, 'success')
      setDeleteTarget(null)
      await load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  function formatMoney(amount: number) {
    return `Rs ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Manage Parts Inventory
          </h1>
          <p className="mt-1 text-slate-600">Automotive parts catalogue, pricing, and stock levels.</p>
        </div>
        <div className="relative flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAlertsOpen((o) => !o)}
            className={[
              'relative inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all duration-200 hover:from-orange-400 hover:to-amber-400',
              hasCriticalStock ? 'animate-pulse' : '',
            ].join(' ')}
          >
            <AlertTriangle className="h-4 w-4" />
            Low Stock Alerts
            {badgeCount > 0 ? (
              <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold">{badgeCount}</span>
            ) : null}
          </button>
          <LowStockAlertsDropdown
            open={alertsOpen}
            onClose={() => setAlertsOpen(false)}
            onViewAll={() => {
              setAlertsOpen(false)
              onViewAllNotifications?.()
            }}
            onCheckInventory={(partId) => {
              setAlertsOpen(false)
              focusPart(partId, { filterOnly: false })
              window.setTimeout(() => {
                rowRefs.current[partId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }, 300)
              window.setTimeout(() => {
                setActiveHighlightId(null)
                setFlashStockPartId(null)
              }, HIGHLIGHT_DURATION_MS)
            }}
          />
          <button
            type="button"
            onClick={() => onNavigateCreate?.()}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition-all duration-200 hover:from-blue-500 hover:to-violet-500"
          >
            <Plus className="h-4 w-4" />
            Add New Part
          </button>
        </div>
      </header>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {filterToPartId != null ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">
            Showing the part from your low stock alert. Review quantity and reorder if needed.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterToPartId(null)
              onClearHighlight?.()
            }}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100"
          >
            Show all parts
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-3 border-b border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </label>
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter Parts"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All categories' : c}
                </option>
              ))}
            </select>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              {vendors.map((v) => (
                <option key={v} value={v}>
                  {v === 'all' ? 'All vendors' : v}
                </option>
              ))}
            </select>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-400"
              />
              Low stock only
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading inventory…
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-20 text-center text-sm text-slate-500">No parts match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Part Number</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock Level</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => {
                  const active = row.isActive && row.status.toLowerCase() !== 'inactive'
                  const highlighted = activeHighlightId === row.id
                  return (
                    <tr
                      key={row.id}
                      ref={(el) => {
                        rowRefs.current[row.id] = el
                      }}
                      className={[
                        'border-b transition-all duration-200 hover:bg-slate-50',
                        index % 2 === 1 && !highlighted ? 'bg-slate-50/40' : 'bg-white',
                        highlighted
                          ? 'inventory-row-highlight border-2 border-red-300 bg-red-50 animate-pulse shadow-sm'
                          : 'border-slate-100',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{row.partNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                      <td className="px-4 py-3 text-slate-600">{row.category}</td>
                      <td className="px-4 py-3 text-slate-600">{row.vendorName}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-800">{formatMoney(row.price)}</td>
                      <StockLevelCell
                        quantity={row.quantity}
                        criticalStockLevel={row.criticalStockLevel}
                        flash={flashStockPartId === row.id}
                      />
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase',
                            active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800',
                          ].join(' ')}
                        >
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <ActionPill label="View" tone="blue" onClick={() => setViewing(row)} />
                          <ActionPill
                            label="Edit"
                            tone="amber"
                            onClick={() => {
                              setEditing(row)
                              setFormMode('edit')
                            }}
                          />
                          {active ? (
                            <ActionPill label="Deactivate" tone="red" onClick={() => setDeactivateTarget(row)} />
                          ) : null}
                          <ActionPill label="Delete" tone="slate" onClick={() => setDeleteTarget(row)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of{' '}
              {filtered.length} parts
            </p>
            <div className="flex items-center justify-end gap-1">
              <PaginationBtn disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </PaginationBtn>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={[
                    'min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-semibold transition',
                    n === safePage ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
              <PaginationBtn disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next
                <ChevronRight className="h-4 w-4" />
              </PaginationBtn>
            </div>
          </div>
        ) : null}
      </div>

      {formMode === 'edit' && editing ? (
        <PartFormModal
          mode="edit"
          open
          initial={editing}
          loading={saving}
          onClose={() => {
            setFormMode(null)
            setEditing(null)
          }}
          onSubmit={handleSave}
        />
      ) : null}

      {viewing ? (
        <PartViewModal
          part={viewing}
          onClose={() => setViewing(null)}
          onEdit={(p) => {
            setEditing(p)
            setFormMode('edit')
          }}
        />
      ) : null}

      <PartDeactivateDialog
        open={Boolean(deactivateTarget)}
        partName={deactivateTarget?.name}
        loading={deactivating}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => void handleDeactivate()}
      />

      <PartDeleteDialog
        open={Boolean(deleteTarget)}
        partName={deleteTarget?.name}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

function ActionPill({
  label,
  tone,
  onClick,
}: {
  label: string
  tone: 'blue' | 'amber' | 'red' | 'slate'
  onClick: () => void
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-200 hover:bg-blue-100',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100',
    red: 'bg-red-50 text-red-700 ring-red-200 hover:bg-red-100',
    slate: 'bg-slate-100 text-slate-800 ring-slate-300 hover:bg-slate-200',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-all duration-200',
        tones[tone],
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function StockLevelCell({
  quantity,
  criticalStockLevel,
  flash,
}: {
  quantity: number
  criticalStockLevel: number
  flash: boolean
}) {
  const stock = stockLevelLabel(quantity, criticalStockLevel)
  const toneClasses = {
    critical: 'text-red-600',
    warning: 'text-amber-600',
    ok: 'text-emerald-600',
  } as const

  return (
    <td
      className={[
        'px-4 py-3',
        flash ? 'inventory-stock-flash' : '',
      ].join(' ')}
    >
      <p
        className={[
          'font-bold tabular-nums',
          stock.tone === 'critical' ? 'text-red-700' : 'text-slate-900',
        ].join(' ')}
      >
        {quantity}
      </p>
      <p
        className={[
          'mt-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide',
          toneClasses[stock.tone],
        ].join(' ')}
      >
        {stock.tone === 'critical' ? <AlertTriangle className="h-3 w-3 shrink-0" /> : null}
        {stock.label}
      </p>
    </td>
  )
}

function PaginationBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}