import { useEffect, useMemo, useState } from 'react'
import { addPart, clearToken, getParts, getToken, type Part } from '../api'

export default function PartsPage(props: { onLogout: () => void }) {
  const token = useMemo(() => getToken(), [])

  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('1')
  const [quantity, setQuantity] = useState('1')

  async function load() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await getParts(token)
      setParts(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load parts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError(null)
    try {
      await addPart(token, {
        name,
        description,
        price: Number(price),
        quantity: Number(quantity),
      })
      setName('')
      setDescription('')
      setPrice('1')
      setQuantity('1')
      await load()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add part')
    }
  }

  function logout() {
    clearToken()
    props.onLogout()
  }

  return (
    <div className="page">
      <div className="header">
        <h2>Parts</h2>
        <button onClick={logout}>Logout</button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="grid">
        <div className="card">
          <h3>Add Part</h3>
          <form className="form" onSubmit={onAdd}>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              Description
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label>
              Price
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
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
              />
            </label>
            <button>Add</button>
          </form>
        </div>

        <div className="card">
          <h3>List</h3>
          {loading ? <p>Loading…</p> : null}
          {!loading && parts.length === 0 ? <p>No parts yet.</p> : null}

          {parts.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Name</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.quantity}</td>
                    <td>{p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </div>
  )
}

