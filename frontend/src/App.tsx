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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - Home is plain JSX
import Home from './pages/Home.jsx'

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()))
  const [screen, setScreen] = useState<'login' | 'register'>('login')
  const [activeTab, setActiveTab] = useState<'home' | 'parts' | 'customers'>('home')

  const handleLogout = () => {
    localStorage.removeItem('token') // Assuming token is in localStorage
    setAuthed(false)
  }

  if (authed) {
    return (
      <div className="app-container">
        <nav style={{ 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          display: 'flex', 
          gap: '1rem', 
          borderBottom: '1px solid #ddd',
          alignItems: 'center'
        }}>
          <button onClick={() => setActiveTab('home')} style={{ fontWeight: activeTab === 'home' ? 'bold' : 'normal' }}>Home</button>
          <button onClick={() => setActiveTab('parts')} style={{ fontWeight: activeTab === 'parts' ? 'bold' : 'normal' }}>Parts</button>
          <button onClick={() => setActiveTab('customers')} style={{ fontWeight: activeTab === 'customers' ? 'bold' : 'normal' }}>Customers</button>
          <button onClick={handleLogout} style={{ marginLeft: 'auto', backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer' }}>Logout</button>
        </nav>

        <main style={{ padding: '1rem' }}>
          {activeTab === 'home' && <Home />}
          {activeTab === 'parts' && <PartsPage onLogout={handleLogout} />}
          {activeTab === 'customers' && <CustomerList />}
        </main>
      </div>
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

