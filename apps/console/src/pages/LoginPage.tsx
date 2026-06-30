import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { sendMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit() {
    if (!email) return
    const { error } = await sendMagicLink(email)
    if (error) {
      setErrorMsg(error)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <main style={{ padding: '2rem' }}>
        <p>Check your email — a sign-in link is on its way to <strong>{email}</strong>.</p>
      </main>
    )
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
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="you@agency.com"
      />
      <button onClick={handleSubmit}>Send sign-in link</button>
      {status === 'error' && <p role="alert">{errorMsg}</p>}
    </main>
  )
}
