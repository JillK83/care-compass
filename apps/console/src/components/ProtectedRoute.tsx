import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) return null  // or a spinner — don't flash the login page

  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}
