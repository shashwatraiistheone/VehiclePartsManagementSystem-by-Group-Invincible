import { useEffect, useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { login } from '../services/authApi'
import { persistAuthSession } from '../lib/auth'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthToast } from '../components/auth/AuthToast'
import { PasswordInput } from '../components/auth/PasswordInput'

const REMEMBER_EMAIL_KEY = 'partsHubRememberEmail'

const inputClass =
  'w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15'

export default function LoginPage(props: {
  onLoggedIn: (role: string) => void
  onGoRegister: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(REMEMBER_EMAIL_KEY)
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await login({ email: email.trim(), password })
      persistAuthSession({
        token: res.token,
        userId: res.userId,
        name: res.name,
        role: res.role,
      })
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim())
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }
      setSuccess('Signed in successfully. Redirecting…')
      props.onLoggedIn(res.role)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div
        className={[
          'rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl shadow-slate-900/[0.04] transition-all duration-500 sm:p-10',
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        ].join(' ')}
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Sign in to access your account. Staff and admin accounts are provisioned by your
            organization.
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Use the email address registered on your account.
            </p>
          </div>

          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <PasswordInput
              id="login-password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="flex items-center gap-2.5">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 transition focus:ring-2 focus:ring-blue-500/30"
            />
            <label htmlFor="remember-me" className="text-sm text-slate-600 select-none">
              Remember me
            </label>
          </div>

          {error ? <AuthToast message={error} variant="error" onDismiss={() => setError(null)} /> : null}
          {success ? <AuthToast message={success} variant="success" /> : null}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition duration-300 hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-blue-600/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden />
                Signing in…
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
          <p className="text-center text-sm text-slate-500">New customer?</p>
          <button
            type="button"
            onClick={props.onGoRegister}
            className="w-full rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm transition duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25"
          >
            Customer Registration
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
