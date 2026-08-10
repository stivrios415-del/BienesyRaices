import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuthStore()

  if (loading) return <div className="p-6 text-ink-500 font-mono text-sm">Cargando…</div>
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}