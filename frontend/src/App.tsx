import { useState } from 'react'
import { getToken } from './api'
import LoginPage from './pages/LoginPage'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - PartsPage is plain JSX
import PartsPage from './pages/PartsPage.jsx'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - CustomerList is plain JSX by design (no extra libs)
import CustomerList from './CustomerList.jsx'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - Register page is plain JSX by design (no extra libs)
import Register from './pages/Register.jsx'

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()))

  const [screen, setScreen] = useState<'login' | 'register'>('login')

  if (authed) {
    return (
      <>
        <CustomerList />
        <PartsPage onLogout={() => setAuthed(false)} />
      </>
    )
  }

  return screen === 'register' ? (
    <Register
      onRegistered={() => setScreen('login')}
      onBackToLogin={() => setScreen('login')}
    />
  ) : (
    <LoginPage
      onLoggedIn={() => setAuthed(true)}
      onGoRegister={() => setScreen('register')}
    />
  )
}

