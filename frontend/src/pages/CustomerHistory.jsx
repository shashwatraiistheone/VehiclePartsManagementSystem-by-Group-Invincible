import { useEffect, useState } from 'react'

export default function CustomerHistory(props) {
  const customerId = props.customerId
  const onClose = props.onClose

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const [sendingInvoiceId, setSendingInvoiceId] = useState(null)
  const [invoiceErrors, setInvoiceErrors] = useState({})
  const [invoiceSuccesses, setInvoiceSuccesses] = useState({})
  const [emails, setEmails] = useState({})

  const handleSendInvoice = async (saleId) => {
    const email = emails[saleId] || ''
    if (!email) {
      setInvoiceErrors((prev) => ({ ...prev, [saleId]: 'Please enter an email address.' }))
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || email.endsWith('@partshub.local')) {
      setInvoiceErrors((prev) => ({
        ...prev,
        [saleId]: 'Please enter a valid external email address (not a fallback local one).',
      }))
      return
    }

    setSendingInvoiceId(saleId)
    setInvoiceErrors((prev) => ({ ...prev, [saleId]: null }))
    setInvoiceSuccesses((prev) => ({ ...prev, [saleId]: null }))

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL
      const res = await fetch(`${apiBase}/api/sales/${saleId}/send-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const text = await res.text()
      const json = text ? JSON.parse(text) : null

      if (!res.ok) {
        throw new Error(json?.message || 'Failed to send invoice email.')
      }

      setInvoiceSuccesses((prev) => ({ ...prev, [saleId]: 'Invoice email sent successfully!' }))

      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          purchases: prev.purchases.map((p) =>
            p.saleId === saleId
              ? { ...p, isInvoiceSent: true, invoiceSentDate: new Date().toISOString() }
              : p
          ),
        }
      })
    } catch (err) {
      setInvoiceErrors((prev) => ({ ...prev, [saleId]: err.message }))
    } finally {
      setSendingInvoiceId(null)
    }
  }

  useEffect(() => {
    if (!customerId) return

    const ctrl = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL
        const res = await fetch(`${apiBase}/api/customer/${customerId}/history`, {
          signal: ctrl.signal,
        })

        const text = await res.text()
        const json = text ? JSON.parse(text) : null

        if (!res.ok) {
          throw new Error(json?.message || json?.title || 'Failed to load history')
        }

        setData(json)

        if (json && json.purchases) {
          const initialEmails = {}
          const custEmail = json.customerEmail || ''
          const isDummy = custEmail.endsWith('@partshub.local')
          json.purchases.forEach((p) => {
            initialEmails[p.saleId] = isDummy ? '' : custEmail
          })
          setEmails(initialEmails)
        }
      } catch (err) {
        if (err?.name === 'AbortError') return
        setError(err?.message ?? 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => ctrl.abort()
  }, [customerId])

  return (
    <div className="modal-body">
      <div className="header" style={{ marginBottom: 20 }}>
        <h3 id="history-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
          Customer history
        </h3>
        <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>

      {loading ? <div className="state-loading">Loading…</div> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && data ? (
        <div style={{ display: 'grid', gap: 24 }}>
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Purchase history</h4>
            {data.purchases?.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {data.purchases.map((p) => (
                  <div key={p.saleId} className="history-nested-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <strong>Sale #{p.saleId}</strong>
                      <span className="muted" style={{ fontSize: '0.875rem' }}>
                        {new Date(p.date).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
                      <div className="muted" style={{ fontSize: '0.875rem' }}>
                        Total: <strong style={{ color: 'var(--text)' }}>{p.totalAmount}</strong>
                      </div>
                      {p.discount ? (
                        <>
                          <div style={{ color: '#15803d', fontSize: '0.875rem' }}>
                            Discount: <strong>-{p.discount}</strong>
                          </div>
                          <div style={{ fontSize: '0.875rem' }}>
                            Final: <strong>{p.finalAmount}</strong>
                          </div>
                          <p style={{ margin: '4px 0 0', color: '#15803d', fontSize: '0.8125rem' }}>
                            Loyalty discount applied
                          </p>
                        </>
                      ) : (
                        <div style={{ fontSize: '0.875rem' }}>
                          Final: <strong>{p.totalAmount}</strong>
                        </div>
                      )}
                    </div>

                    {p.items?.length ? (
                      <div className="table-wrap" style={{ marginTop: 12 }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Qty</th>
                              <th>Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.items.map((i) => (
                              <tr key={`${p.saleId}-${i.partId}-${i.price}`}>
                                <td>{i.partName || `Part #${i.partId}`}</td>
                                <td>{i.quantity}</td>
                                <td>{i.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="muted" style={{ margin: '10px 0 0', fontSize: '0.875rem' }}>
                        No line items.
                      </p>
                    )}

                    {/* Invoice Email Sending / History Interface */}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                      {p.isInvoiceSent ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: '#16a34a', fontWeight: 500 }}>
                              <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <span>Invoice Sent</span>
                            </div>
                            <button
                              type="button"
                              className="linkBtn"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => {
                                setData((prev) => {
                                  if (!prev) return prev
                                  return {
                                    ...prev,
                                    purchases: prev.purchases.map((x) =>
                                      x.saleId === p.saleId ? { ...x, isInvoiceSent: false } : x
                                    ),
                                  }
                                })
                              }}
                            >
                              Resend Invoice
                            </button>
                          </div>
                          <span className="muted" style={{ fontSize: '0.8125rem' }}>
                            Sent to <strong>{emails[p.saleId] || data.customerEmail}</strong> on {new Date(p.invoiceSentDate).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              type="email"
                              placeholder="Enter customer email"
                              value={emails[p.saleId] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value
                                setEmails((prev) => ({ ...prev, [p.saleId]: val }))
                              }}
                              disabled={sendingInvoiceId === p.saleId}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                fontSize: '0.8125rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                outline: 'none',
                                background: '#fafbfc'
                              }}
                            />
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={sendingInvoiceId === p.saleId || !emails[p.saleId]?.trim()}
                              onClick={() => handleSendInvoice(p.saleId)}
                              style={{
                                padding: '6px 14px',
                                fontSize: '0.8125rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                height: 34
                              }}
                            >
                              {sendingInvoiceId === p.saleId ? (
                                <>
                                  <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }}>
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Sending...
                                </>
                              ) : (
                                'Send Invoice'
                              )}
                            </button>
                          </div>

                          {invoiceErrors[p.saleId] && (
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 500 }}>
                              {invoiceErrors[p.saleId]}
                            </p>
                          )}

                          {invoiceSuccesses[p.saleId] && (
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#16a34a', fontWeight: 500 }}>
                              {invoiceSuccesses[p.saleId]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No purchases found.</p>
            )}
          </div>

          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Service history</h4>
            {data.services?.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.services.map((s) => (
                      <tr key={s.appointmentId}>
                        <td>{s.serviceType}</td>
                        <td>{s.status}</td>
                        <td className="muted">{new Date(s.date).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No services found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
