import { useEffect, useState } from 'react'

export default function CustomerHistory(props) {
  const customerId = props.customerId
  const onClose = props.onClose

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

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
