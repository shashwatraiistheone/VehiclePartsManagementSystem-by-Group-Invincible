import { useEffect, useMemo, useState } from 'react'
import { WrenchScrewdriverIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { PartRequest } from '../../services/partRequestApi'
import { EmptyState } from './shared'
import type { CustomerNavId } from './types'
import {
  displayPartRequestStatus,
  formatRequestDate,
  formatRequestDateTime,
  partRequestStatusBadgeClass,
  responseNotesPreview,
} from './partRequestDisplay'

type Props = {
  requests: PartRequest[]
  onChange: (requests: PartRequest[]) => void
  onNavigate: (navId: CustomerNavId) => void
}

export function MyPartRequestsPage({ requests: initial, onNavigate }: Props) {
  const [requests, setRequests] = useState(initial)
  const [detail, setDetail] = useState<PartRequest | null>(null)

  useEffect(() => {
    setRequests(initial)
  }, [initial])

  const rows = useMemo(
    () =>
      [...requests].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [requests],
  )

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          My Part Requests
        </h1>
        <button
          type="button"
          onClick={() => onNavigate('request-part')}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 active:scale-[0.98]"
        >
          <WrenchScrewdriverIcon className="h-4 w-4 stroke-[2.5]" />
          New Request
        </button>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900">Part Sourcing Status</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Track your requested parts and see updates from our fulfillment team
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="No part requests submitted yet"
              description="Request parts we don't currently stock and we'll source them for you."
              action={
                <button
                  type="button"
                  onClick={() => onNavigate('request-part')}
                  className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-800"
                >
                  Create Request
                </button>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-500">
                      Requested Part
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-500">
                      Request Date
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-500">
                      Status
                    </th>
                    <th className="min-w-[220px] px-5 py-3 text-xs font-semibold text-slate-500">
                      Response / Notes
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, index) => (
                    <tr
                      key={r.id}
                      className={[
                        'border-b border-slate-100 last:border-b-0',
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30',
                        'hover:bg-blue-50/30',
                      ].join(' ')}
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                        {r.partName}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatRequestDate(r.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${partRequestStatusBadgeClass(r.status)}`}
                        >
                          {displayPartRequestStatus(r.status)}
                        </span>
                      </td>
                      <td className="max-w-md px-5 py-4 text-slate-600">
                        <p className="line-clamp-2 text-sm leading-snug">
                          {responseNotesPreview(r.responseNotes, null)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDetail(r)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {rows.map((r) => (
                <li key={r.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">{r.partName}</p>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${partRequestStatusBadgeClass(r.status)}`}
                    >
                      {displayPartRequestStatus(r.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{formatRequestDate(r.createdAt)}</p>
                  <p className="text-sm text-slate-600">
                    {responseNotesPreview(r.responseNotes, null)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDetail(r)}
                    className="text-xs font-semibold text-blue-600"
                  >
                    History
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {detail ? (
        <RequestDetailModal request={detail} onClose={() => setDetail(null)} />
      ) : null}
    </div>
  )
}

function RequestDetailModal({
  request,
  onClose,
}: {
  request: PartRequest
  onClose: () => void
}) {
  const staffNotes = request.responseNotes?.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="part-request-detail-title"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 id="part-request-detail-title" className="text-sm font-semibold text-slate-900">
            Request history
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Part</p>
            <p className="mt-1 font-medium text-slate-900">{request.partName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${partRequestStatusBadgeClass(request.status)}`}
              >
                {displayPartRequestStatus(request.status)}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quantity</p>
              <p className="mt-1 text-slate-700">{request.quantity ?? 1}</p>
            </div>
          </div>
          {request.vehicleDetails ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vehicle</p>
              <p className="mt-1 text-slate-700">{request.vehicleDetails}</p>
            </div>
          ) : null}
          {request.description ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Your description
              </p>
              <p className="mt-1 text-slate-700">{request.description}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Response / notes
            </p>
            <p className="mt-1 leading-relaxed text-slate-700">
              {staffNotes ??
                'No team response yet. Our fulfillment team will update this when your request progresses.'}
            </p>
          </div>
          <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
            <p>Submitted: {formatRequestDateTime(request.createdAt)}</p>
            {request.updatedAt ? (
              <p className="mt-0.5">Last updated: {formatRequestDateTime(request.updatedAt)}</p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
