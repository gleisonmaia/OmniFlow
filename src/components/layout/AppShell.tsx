import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useContextStore } from '../../store/contextStore'
import { Alert } from '../ui/Alert'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const user = useAuthStore((s) => s.user)
  const load = useContextStore((s) => s.load)
  const error = useContextStore((s) => s.error)
  const retry = useContextStore((s) => s.retry)
  const loading = useContextStore((s) => s.loading)

  useEffect(() => {
    if (user?.id != null && user.setor) {
      void load(user.id, user.setor)
    }
  }, [user?.id, user?.setor, load])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--surface-page)', color: 'var(--ink)' }}>
      <Sidebar />
      <main style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {error ? (
          <div style={{ padding: '12px 32px 0' }}>
            <Alert tone="warning" actionLabel="Tentar de novo" onAction={retry}>
              {error}
            </Alert>
          </div>
        ) : null}
        {loading ? (
          <div style={{ padding: '8px 32px 0', fontSize: 13, color: 'var(--ink-muted)' }}>
            Carregando contexto da squad…
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  )
}
