import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const bootstrapped = useAuthStore((s) => s.bootstrapped)
  const location = useLocation()

  if (!bootstrapped) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--surface-page)',
          color: 'var(--ink-muted)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Carregando sessão…
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
