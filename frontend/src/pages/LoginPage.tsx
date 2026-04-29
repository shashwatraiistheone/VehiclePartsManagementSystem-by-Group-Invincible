import { useEffect, useState } from 'react'
import {
  ShieldCheckIcon,
  CubeIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline'
import { login, setToken } from '../api'

const REMEMBER_EMAIL_KEY = 'partsHubRememberEmail'

const features = [
  {
    Icon: ShieldCheckIcon,
    title: 'Secure & Reliable',
    description: 'Protected access and audited authentication.',
  },
  {
    Icon: CubeIcon,
    title: 'Real-time Inventory',
    description: 'Parts and stock updates when your team makes changes.',
  },
  {
    Icon: PresentationChartLineIcon,
    title: 'Business Analytics',
    description: 'Dashboard insights for smarter ordering and sales.',
  },
] as const

export default function LoginPage(props: {
  onLoggedIn: () => void
  onGoRegister: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    setLoading(true)
    try {
      const res = await login(email.trim(), password)
      setToken(res.token)
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim())
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }
      props.onLoggedIn()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Left: brand & highlights (~60% on large screens) */}
      <aside
        className={[
          'relative order-2 flex flex-1 flex-col justify-center overflow-hidden px-8 py-14 sm:px-12 lg:order-1 lg:flex-[0_0_60%] lg:max-w-none lg:py-16 lg:pl-14 lg:pr-10',
          'bg-gradient-to-br from-slate-950 via-blue-950 to-blue-600 text-white',
          'transition-opacity duration-700 ease-out',
          mounted ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_20%,rgba(96,165,250,0.25),transparent)]"
        />
        <div className="relative z-10 mx-auto w-full max-w-xl">
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
            PartsHub
          </h1>
          <p className="mb-10 max-w-lg text-base leading-relaxed text-blue-100/95 sm:text-lg">
            Manage vehicle parts inventory, staff, and operations efficiently in one place.
          </p>
          <ul className="flex flex-col gap-5">
            {features.map(({ Icon, title, description }) => (
              <li
                key={title}
                className="group flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition duration-300 hover:border-white/20 hover:bg-white/10"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 transition group-hover:scale-105 group-hover:bg-white/15">
                  <Icon className="h-6 w-6 text-blue-100" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-blue-100/85">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right: login card (~40%) */}
      <main className="order-1 flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:order-2 lg:flex-[0_0_40%] lg:px-10 lg:py-12">
        <div
          className={[
            'w-full max-md:max-w-md transition-all duration-500 ease-out',
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          ].join(' ')}
        >
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to access your account</p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={onSubmit}>
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Username
                </label>
                <input
                  id="login-email"
                  name="username"
                  type="email"
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500/20 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4"
                />
                <p className="mt-1 text-xs text-slate-400">Use the email address registered on your account.</p>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500/20 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="text-sm text-slate-600 select-none">
                  Remember me
                </label>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition duration-300 hover:from-blue-500 hover:via-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-blue-600/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10">{loading ? 'Signing in…' : 'Login'}</span>
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition duration-300 group-hover:opacity-100 group-hover:translate-x-full translate-x-[-100%]"
                />
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              No account?{' '}
              <button
                type="button"
                onClick={props.onGoRegister}
                className="font-semibold text-blue-600 underline-offset-2 transition hover:text-blue-700 hover:underline"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
