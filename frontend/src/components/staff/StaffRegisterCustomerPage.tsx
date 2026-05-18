import { useState } from 'react'
import { CircleCheckBig } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CustomerForm } from './CustomerForm'
import type { CustomerInput } from './customerModule'
import { staffPath } from '../../staff/staffRoutes'

type Props = {
  onRegister: (payload: CustomerInput) => void
}

export function StaffRegisterCustomerPage({ onRegister }: Props) {
  const navigate = useNavigate()
  const [success, setSuccess] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-6xl space-y-6 bg-gray-100 p-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Register Customer</h1>
        <p className="mt-1 text-sm text-slate-600">Add a new customer and vehicle details.</p>
      </header>

      {success ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CircleCheckBig className="h-4 w-4" />
          {success}
        </div>
      ) : null}

      <CustomerForm
        title="Customer Registration Form"
        submitLabel="Submit"
        onSubmit={(value: CustomerInput) => {
          onRegister(value)
          setSuccess('Customer saved successfully. Redirecting to Manage Customers...')
          window.setTimeout(() => navigate(staffPath('manage-customers')), 700)
        }}
      />
    </div>
  )
}
