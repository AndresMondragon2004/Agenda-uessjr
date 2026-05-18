import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B4332]" />
    </div>
  )

  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export function SuperAdminRoute({ children }) {
  const { isAdmin, isSuperAdmin, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B4332]" />
    </div>
  )

  if (!isAdmin || !isSuperAdmin) return <Navigate to="/admin/dashboard" replace />
  return children
}
