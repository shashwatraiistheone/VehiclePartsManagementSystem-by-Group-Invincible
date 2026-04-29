import React, { useState, useEffect } from 'react'
import { getVendors, addVendor, getToken } from '../api'
import type { Vendor, CreateVendor } from '../api'

const VendorPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const token = getToken()

  useEffect(() => {
    if (token) {
      void fetchVendors()
    }
  }, [token])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const data = await getVendors(token!)
      setVendors(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch vendors'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      setError('Name and email are required.')
      return
    }

    try {
      setLoading(true)
      setError('')
      const newVendor: CreateVendor = { name, email }
      await addVendor(token!, newVendor)
      setName('')
      setEmail('')
      await fetchVendors()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add vendor'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>Vendors</h2>
        <p>Maintain supplier contacts for your parts network.</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Add vendor</h3>
        <form onSubmit={handleAddVendor}>
          <div className="vendor-form-row">
            <div>
              <label>
                Vendor name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Supplier Inc."
                  required
                />
              </label>
            </div>
            <div>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="orders@supplier.com"
                  required
                />
              </label>
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <button type="submit" disabled={loading}>
                {loading ? 'Adding…' : 'Add vendor'}
              </button>
            </div>
          </div>
        </form>
        {error ? <p className="error" style={{ marginTop: 12 }}>{error}</p> : null}
      </div>

      <div className="card">
        <h3>Vendor list</h3>
        {loading && vendors.length === 0 ? (
          <div className="state-loading">Loading vendors…</div>
        ) : vendors.length === 0 ? (
          <div className="state-empty">No vendors yet. Add one above.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="muted">{vendor.id}</td>
                    <td>{vendor.name}</td>
                    <td>{vendor.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default VendorPage
