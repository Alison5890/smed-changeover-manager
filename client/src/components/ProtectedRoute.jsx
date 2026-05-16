import { Navigate, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingPage } from '@/components/ui/spinner'

export default function ProtectedRoute({ children, requireAdmin = false, requirePath = null }) {
  const { user, loading, canAccess, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingPage />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  if (requireAdmin && !isAdmin) return <AccessDenied />
  if (requirePath && !canAccess(requirePath)) return <AccessDenied />

  return children
}

function AccessDenied() {
  return (
    <div className="p-12 max-w-md mx-auto text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
        <Lock size={20} className="text-red-600" />
      </div>
      <h2 className="text-base font-semibold text-slate-800 mb-1">Access denied</h2>
      <p className="text-sm text-slate-500">You don't have permission to view this page. Contact an administrator if you think this is a mistake.</p>
    </div>
  )
}
