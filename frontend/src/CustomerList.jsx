import { useEffect, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - CustomerHistory is plain JSX by design (no extra libs)
import CustomerHistory from './pages/CustomerHistory.jsx'

function safeJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export default function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL
      const res = await fetch(`${apiBase}/api/Customer`)
      const text = await res.text()
      const data = safeJson(text)

      if (!res.ok) {
        throw new Error(data?.message || data?.title || 'Failed to load customers')
      }
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message ?? 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addCustomer(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL
      const res = await fetch(`${apiBase}/api/Customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, address: '' }),
      })

      const text = await res.text()
      const data = safeJson(text)

      if (!res.ok) {
        throw new Error(data?.message || data?.title || 'Failed to add customer')
      }

      setName('')
      setEmail('')
      setPhone('')
      await load()
    } catch (err) {
      setError(err?.message ?? 'Failed to add customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page">
        <div className="page-head">
          <h2>Customers</h2>
          <p>Add records and open purchase & service history.</p>
        </div>

        {error ? <p className="error" style={{ marginBottom: 16 }}>{error}</p> : null}

        <div className="grid">
          <div className="card">
            <h3>Add customer</h3>
            <form className="form" onSubmit={addCustomer}>
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  placeholder="email@example.com"
                />
              </label>
              <label>
                Phone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 …" />
              </label>
              <button type="submit" disabled={saving}>
                {saving ? 'Adding…' : 'Add customer'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3>Directory</h3>
            {loading ? <div className="state-loading">Loading…</div> : null}
            {!loading && customers.length === 0 ? (
              <div className="state-empty">No customers yet.</div>
            ) : null}

            {customers.length > 0 ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th style={{ width: 100 }}>History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id ?? `${c.name}-${c.email}`}>
                        <td>{c.name}</td>
                        <td>{c.email}</td>
                        <td className="muted">{c.phone}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            onClick={() => setSelectedCustomerId(c.id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {selectedCustomerId != null ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelectedCustomerId(null)}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
            onClick={(e) => e.stopPropagation()}
          >
            <CustomerHistory
              customerId={selectedCustomerId}
              onClose={() => setSelectedCustomerId(null)}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
