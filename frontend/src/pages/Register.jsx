import { useState } from 'react'

function safeJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function formatRegisterError(data) {
  if (!data) return 'Registration failed'
  if (data.message) return data.message
  if (data.detail) return String(data.detail)
  if (data.title && data.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first) && first[0]) return String(first[0])
  }
  return data.title || 'Registration failed'
}

export default function Register(props) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Staff')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role }),
      })

      const text = await res.text()
      const data = safeJson(text)

      if (!res.ok) {
        throw new Error(formatRegisterError(data))
      }

      props.onRegistered()
    } catch (err) {
      setError(err?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark" aria-hidden>
            PH
          </div>
          <h1>PartsHub</h1>
          <p>Create a staff or admin account</p>
        </div>
        <h2>Register</h2>

        <form className="form" onSubmit={onSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="jane.smith"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@company.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>

          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
            </select>
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="hint">
          Already registered?{' '}
          <button type="button" className="linkBtn" onClick={props.onBackToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
