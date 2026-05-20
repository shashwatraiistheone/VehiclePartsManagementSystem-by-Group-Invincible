import { useEffect } from 'react'
import { SESSION_EXPIRED_MESSAGE, setUnauthorizedHandler } from '../../lib/apiClient'
import { clearSession } from '../../lib/authStorage'
import { useToast } from '../ui/ToastProvider'

type Props = {
  onSessionExpired: () => void
}

/** Wires global 401 handling: clear session, toast, redirect to login. */
export function AuthSessionManager({ onSessionExpired }: Props) {
  const { showToast } = useToast()

  useEffect(() => {
    const handleExpired = () => {
      clearSession()
      showToast(SESSION_EXPIRED_MESSAGE, 'error')
      onSessionExpired()
    }

    setUnauthorizedHandler(handleExpired)

    const onFetchUnauthorized = () => handleExpired()
    window.addEventListener('app:unauthorized', onFetchUnauthorized)

    return () => {
      setUnauthorizedHandler(null)
      window.removeEventListener('app:unauthorized', onFetchUnauthorized)
    }
  }, [onSessionExpired, showToast])

  return null
}
