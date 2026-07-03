import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <main style={{ padding: '2rem' }}>
      <h1>Care Console</h1>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@agency.com"
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSignIn()}
        placeholder="Password"
      />
      <button onClick={handleSignIn}>Sign in</button>
      {passwordError && <p role="alert">{passwordError}</p>}
    </main>
  )
}
