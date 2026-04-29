import { useEffect, useMemo, useState } from 'react'
import { addPart, getParts, getToken } from '../api'

export default function PartsPage() {
  const token = useMemo(() => getToken(), [])

  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('1')
  const [quantity, setQuantity] = useState('1')

  async function load() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await getParts(token)
      setParts(data)
    } catch (err) {
      setError(err?.message ?? 'Failed to load parts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onAdd(e) {
    e.preventDefault()
    if (!token) return
    setError(null)
    try {
      await addPart(token, {
        name,
        price: Number(price),
        quantity: Number(quantity),
      })
      setName('')
      setPrice('1')
      setQuantity('1')
      await load()
    } catch (err) {
      setError(err?.message ?? 'Failed to add part')
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>Parts</h2>
        <p>Add catalogue items and monitor stock.</p>
      </div>

      {error ? <p className="error" style={{ marginBottom: 16 }}>{error}</p> : null}

      <div className="grid">
        <div className="card">
          <h3>Add part</h3>
          <form className="form" onSubmit={onAdd}>
            <label>
              Part name
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Oil filter" />
            </label>
            <label>
              Price
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </label>
            <button type="submit">Add part</button>
          </form>
        </div>

        <div className="card">
          <h3>Inventory</h3>
          {loading ? <div className="state-loading">Loading inventory…</div> : null}
          {!loading && parts.length === 0 ? (
            <div className="state-empty">No parts yet. Add your first item using the form.</div>
          ) : null}

          {parts.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p) => (
                    <tr key={p.id}>
                      <td className="muted">{p.id}</td>
                      <td>{p.name}</td>
                      <td>${Number(p.price).toFixed(2)}</td>
                      <td>{p.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
