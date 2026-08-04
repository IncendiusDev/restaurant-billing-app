import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

export function RequireAuth({ roles }: { roles?: UserRole[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'waiter') return <Navigate to="/waiter" replace />
    if (user.role === 'restaurant_admin') return <Navigate to="/admin" replace />
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
