import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

export function LoginPage() {
  const { session, signInWithPassword } = useAuth()
  const navigate = useNavigate()
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (session) navigate('/clients', { replace: true })
  }, [session, navigate])

  async function handleSignIn() {
    if (!email || !password) return
    setPasswordError('')
    const { error } = await signInWithPassword(email, password)
    if (error) setPasswordError(error)
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <h1 className="login-title">Care Console</h1>
        <div className="field-group">
          <label className="field-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className="field-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@agency.com"
            autoComplete="email"
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="field-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignIn()}
            placeholder="Password"
            autoComplete="current-password"
          />
        </div>
        {passwordError && (
          <p role="alert" style={{ fontSize: 'var(--text-sm)', color: 'var(--red-critical)', margin: 0 }}>
            {passwordError}
          </p>
        )}
        <button className="btn-primary" onClick={handleSignIn}>
          Sign in
        </button>
      </div>
    </main>
  )
}
