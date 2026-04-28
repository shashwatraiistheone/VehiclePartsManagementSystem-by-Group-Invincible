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
    <div className="card">
      <div className="header" style={{ margin: 0 }}>
        <h3>Customer History</h3>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && data ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <h4 style={{ margin: '0 0 8px' }}>Purchase History</h4>
            {data.purchases?.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {data.purchases.map((p) => (
                  <div key={p.saleId} className="card" style={{ boxShadow: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <strong>Sale #{p.saleId}</strong>
                      <span>{new Date(p.date).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                      <div>
                        Total: <strong>{p.totalAmount}</strong>
                      </div>
                      {p.discount ? (
                        <>
                          <div style={{ color: '#15803d' }}>
                            Discount: <strong>-{p.discount}</strong>
                          </div>
                          <div>
                            Final: <strong>{p.finalAmount}</strong>
                          </div>
                          <p style={{ margin: 0, color: '#15803d' }}>
                            You received a 10% loyalty discount
                          </p>
                        </>
                      ) : (
                        <div>
                          Final: <strong>{p.totalAmount}</strong>
                        </div>
                      )}
                    </div>

                    {p.items?.length ? (
                      <table className="table" style={{ marginTop: 8 }}>
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
                    ) : (
                      <p style={{ margin: '8px 0 0' }}>No items.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No purchases found.</p>
            )}
          </div>

          <div>
            <h4 style={{ margin: '0 0 8px' }}>Service History</h4>
            {data.services?.length ? (
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
                      <td>{new Date(s.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No services found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

