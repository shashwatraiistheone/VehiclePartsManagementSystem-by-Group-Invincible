import { useEffect, useMemo, useState } from 'react'

function apiBase() {
  const base = import.meta.env.VITE_API_BASE_URL
  if (!base) throw new Error('Missing VITE_API_BASE_URL. Add it to frontend/.env')
  return base
}

export default function VendorPage() {
  const baseUrl = useMemo(() => apiBase(), [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [vendors, setVendors] = useState([])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function fetchVendors(signal) {
    const res = await fetch(`${baseUrl}/api/vendor`, { signal })
    const text = await res.text()
    const data = text ? JSON.parse(text) : null

    if (!res.ok) {
      throw new Error(data?.message || data?.title || 'Failed to fetch vendors')
    }

    return Array.isArray(data) ? data : []
  }

  async function refresh(signal) {
    setError('')
    try {
      const list = await fetchVendors(signal)
      setVendors(list)
    } catch (e) {
      if (e?.name === 'AbortError') return
      setError(e?.message ?? 'Failed to fetch vendors')
    }
  }

  useEffect(() => {
    const ctrl = new AbortController()
    refresh(ctrl.signal)
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onAdd(e) {
    e.preventDefault()
    setError('')

    const cleanName = name.trim()
    const cleanEmail = email.trim()

    if (!cleanName) return setError('Vendor name is required.')
    if (!cleanEmail) return setError('Vendor email is required.')

    setBusy(true)
    try {
      const res = await fetch(`${baseUrl}/api/vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail }),
      })

      const text = await res.text()
      const data = text ? JSON.parse(text) : null

      if (!res.ok) {
        throw new Error(data?.message || data?.title || 'Failed to add vendor')
      }

      setName('')
      setEmail('')
      await refresh()
    } catch (e) {
      setError(e?.message ?? 'Failed to add vendor')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="header">
        <h2>Vendor Management</h2>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="grid">
        <div className="card">
          <h3>Add Vendor</h3>
          <form className="form" onSubmit={onAdd}>
            <label>
              Vendor Name
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              Vendor Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button disabled={busy}>{busy ? 'Adding…' : 'Add Vendor'}</button>
          </form>
        </div>

        <div className="card">
          <h3>Vendors</h3>

          {vendors.length === 0 ? (
            <p>No vendors yet.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {vendors.map((v) => (
                <li key={v.id}>
                  <strong>{v.name}</strong> — <span>{v.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

