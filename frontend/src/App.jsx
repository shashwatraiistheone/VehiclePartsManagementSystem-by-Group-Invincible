import { useCallback, useEffect, useMemo, useState } from 'react'

// ─── Dummy data ───────────────────────────────────────────────────────────────
const INITIAL_STAFF = [
  { id: 1, name: 'Bikram Poudel', email: 'bikram@vparts.com', phone: '9800000001', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Kushal Tamang', email: 'kushal@vparts.com', phone: '9800000002', role: 'Staff', status: 'Active' },
  { id: 3, name: 'Sita Rai', email: 'sita@vparts.com', phone: '9800000003', role: 'Staff', status: 'Inactive' },
  { id: 4, name: 'Ram Shrestha', email: 'ram@vparts.com', phone: '9800000004', role: 'Staff', status: 'Active' },
]

// Mock preview accepts demo creds OR the backend seeded admin (same as API).
const VALID_LOGINS = [
  { email: 'admin@vparts.com', password: 'admin123', displayName: 'Bikram Poudel' },
  { email: 'admin@partshub.local', password: 'Admin@123', displayName: 'System Administrator' },
]

const NAV_ITEMS = [
  { id: 'staff', label: 'Staff' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'parts', label: 'Parts' },
  { id: 'reports', label: 'Reports' },
]

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'Staff',
})

// ─── Root app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('login')
  const [loggedInName, setLoggedInName] = useState('Bikram Poudel')
  const [staff, setStaff] = useState(INITIAL_STAFF)
  const [search, setSearch] = useState('')
  const [activeNav, setActiveNav] = useState('staff')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return staff
    return staff.filter((s) => s.name.toLowerCase().includes(q))
  }, [staff, search])

  function handleLoginSuccess(name) {
    setLoggedInName(name)
    setScreen('dashboard')
    showToast('Welcome back!')
  }

  function handleLogout() {
    setScreen('login')
    setSearch('')
    setAddOpen(false)
    setEditOpen(false)
    setDeleteTarget(null)
  }

  async function fakeSave(action) {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSaving(false)
    action()
  }

  function handleAddStaff(data) {
    void fakeSave(() => {
      const nextId = staff.reduce((max, s) => Math.max(max, s.id), 0) + 1
      setStaff((prev) => [
        ...prev,
        {
          id: nextId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          status: 'Active',
        },
      ])
      setAddOpen(false)
      showToast(`${data.name} added successfully.`)
    })
  }

  function handleEditStaff(data) {
    void fakeSave(() => {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, name: data.name, email: data.email, phone: data.phone, role: data.role }
            : s,
        ),
      )
      setEditOpen(false)
      setEditingId(null)
      showToast(`${data.name} updated successfully.`)
    })
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    void fakeSave(() => {
      const name = deleteTarget.name
      setStaff((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast(`${name} removed.`)
    })
  }

  const editingStaff = staff.find((s) => s.id === editingId)

  if (screen === 'login') {
    return (
      <>
        <LoginPage onSuccess={handleLoginSuccess} />
        {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}
      </>
    )
  }

  return (
    <AppShell>
      <TopNavbar userName={loggedInName} onLogout={handleLogout} />

      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar activeNav={activeNav} onNav={setActiveNav} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeNav === 'staff' ? (
            <StaffListSection
              staff={filteredStaff}
              search={search}
              onSearchChange={setSearch}
              onAdd={() => setAddOpen(true)}
              onEdit={(row) => {
                setEditingId(row.id)
                setEditOpen(true)
              }}
              onDelete={setDeleteTarget}
            />
          ) : (
            <PlaceholderSection label={NAV_ITEMS.find((n) => n.id === activeNav)?.label ?? 'Page'} />
          )}
        </main>
      </div>

      <StaffFormModal
        open={addOpen}
        mode="add"
        saving={saving}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddStaff}
      />

      <StaffFormModal
        open={editOpen}
        mode="edit"
        saving={saving}
        initial={editingStaff}
        onClose={() => {
          setEditOpen(false)
          setEditingId(null)
        }}
        onSubmit={handleEditStaff}
      />

      <DeleteDialog
        open={Boolean(deleteTarget)}
        name={deleteTarget?.name}
        saving={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}
    </AppShell>
  )
}

function AppShell({ children }) {
  return <div className="flex min-h-screen flex-col bg-slate-100">{children}</div>
}

// ─── 1. Login page ────────────────────────────────────────────────────────────
function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))

    const normalized = email.trim().toLowerCase()
    const match = VALID_LOGINS.find(
      (l) => l.email.toLowerCase() === normalized && l.password === password,
    )

    setLoading(false)
    if (match) {
      onSuccess(match.displayName)
    } else {
      setError(
        'Invalid email or password. Use admin@vparts.com / admin123 or admin@partshub.local / Admin@123',
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <h1 className="text-center text-2xl font-bold text-slate-900">VParts Hub</h1>
        <p className="mb-6 mt-1 text-center text-sm text-slate-500">Vehicle Parts Management System</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@vparts.com"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? <Spinner /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">
          Demo: admin@vparts.com / admin123
          <br />
          or admin@partshub.local / Admin@123
        </p>
      </div>
    </div>
  )
}

// ─── 2. Dashboard shell ───────────────────────────────────────────────────────
function TopNavbar({ userName, onLogout }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      <span className="text-lg font-bold text-slate-900">VParts Hub</span>
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="hidden text-sm text-slate-600 sm:inline">
          Signed in as <strong className="text-slate-900">{userName}</strong>
        </span>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

function Sidebar({ activeNav, onNav }) {
  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-slate-900 text-slate-200 md:w-56 md:border-b-0 md:border-r lg:w-64">
      <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:p-4" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const active = activeNav === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNav(item.id)}
              className={[
                'whitespace-nowrap rounded-lg px-4 py-2.5 text-left text-sm font-medium transition',
                active
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              ].join(' ')}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

function PlaceholderSection({ label }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <h2 className="text-xl font-bold text-slate-800">{label}</h2>
      <p className="mt-2 text-slate-500">Preview only — staff management is fully interactive.</p>
    </div>
  )
}

// ─── Staff list ───────────────────────────────────────────────────────────────
function StaffListSection({ staff, search, onSearchChange, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <StaffListHeader onAdd={onAdd} />

      <StaffSearchBar search={search} onSearchChange={onSearchChange} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No staff match your search.
                  </td>
                </tr>
              ) : (
                staff.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.email}</td>
                    <td className="px-4 py-3 text-slate-600">{row.phone}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={row.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="mr-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StaffListHeader({ onAdd }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Staff management</h2>
        <p className="text-sm text-slate-500">Register and manage staff accounts (mock data).</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500"
      >
        + Add Staff
      </button>
    </div>
  )
}

function StaffSearchBar({ search, onSearchChange }) {
  return (
    <div className="mb-4">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search staff by name…"
        className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  )
}

function RoleBadge({ role }) {
  const isAdmin = role === 'Admin'
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
        isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800',
      ].join(' ')}
    >
      {role}
    </span>
  )
}

function StatusBadge({ status }) {
  const active = status === 'Active'
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
        active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600',
      ].join(' ')}
    >
      {status}
    </span>
  )
}

// ─── 3 & 4. Add / Edit modal ──────────────────────────────────────────────────
function StaffFormModal({ open, mode, initial, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setForm({
        name: initial.name,
        email: initial.email,
        phone: initial.phone,
        password: '',
        role: initial.role,
      })
    } else {
      setForm(emptyForm())
    }
    setErrors({})
  }, [open, mode, initial])

  if (!open) return null

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Full name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email'
    if (!form.phone.trim()) next.phone = 'Phone is required'
    if (mode === 'add' && !form.password.trim()) next.password = 'Password is required'
    if (mode === 'add' && form.password.trim() && form.password.length < 6) {
      next.password = 'Password must be at least 6 characters'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
    })
  }

  function field(name, label, type = 'text', opts = {}) {
    const err = errors[name]
    return (
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">{label}</span>
        <input
          type={type}
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          disabled={opts.disabled || saving}
          className={[
            'w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2',
            err
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20',
            opts.disabled ? 'bg-slate-100 text-slate-500' : '',
          ].join(' ')}
        />
        {err ? <span className="mt-1 block text-xs text-red-600">{err}</span> : null}
      </label>
    )
  }

  return (
    <ModalBackdrop onClose={saving ? undefined : onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900">
          {mode === 'add' ? 'Add staff member' : 'Edit staff member'}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'add' ? 'Create a new account with role and credentials.' : 'Update staff details.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {field('name', 'Full Name')}
          {field('email', 'Email', 'email', { disabled: mode === 'edit' })}
          {field('phone', 'Phone', 'tel')}
          {mode === 'add' ? field('password', 'Password', 'password') : null}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Role</span>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
            </select>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {saving ? <Spinner /> : null}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  )
}

// ─── 5. Delete dialog ─────────────────────────────────────────────────────────
function DeleteDialog({ open, name, saving, onCancel, onConfirm }) {
  if (!open) return null
  return (
    <ModalBackdrop onClose={saving ? undefined : onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900">Delete staff member?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Are you sure you want to remove <strong>{name}</strong>? This action cannot be undone.
        </p>
        <DeleteActionButtons saving={saving} onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </ModalBackdrop>
  )
}

function DeleteActionButtons({ saving, onCancel, onConfirm }) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
      >
        {saving ? <Spinner /> : null}
        {saving ? 'Deleting…' : 'Confirm delete'}
      </button>
    </div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function ModalBackdrop({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      {children}
    </div>
  )
}

function Toast({ toast, onClose }) {
  const success = toast.type !== 'error'
  return (
    <div
      role="status"
      className={[
        'fixed bottom-4 right-4 z-[60] flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg',
        success ? 'bg-emerald-600' : 'bg-red-600',
      ].join(' ')}
    >
      <span className="flex-1">{toast.message}</span>
      <button type="button" onClick={onClose} className="opacity-80 hover:opacity-100" aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
