import { useState } from 'react'
import { login, setToken } from '../api'

export default function LoginPage(props: {
  onLoggedIn: () => void
  onGoRegister: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await login(email, password)
      setToken(res.token)
      props.onLoggedIn()
    } catch (err: any) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Login</h2>
        <form className="form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <p className="hint">
          Uses <code>/api/auth/login</code> and stores JWT in{' '}
          <code>localStorage</code>.
        </p>
        <p className="hint">
          Don&apos;t have an account?{' '}
          <button type="button" className="linkBtn" onClick={props.onGoRegister}>
            Register
          </button>
        </p>
      </div>
    </div>
  )
}

