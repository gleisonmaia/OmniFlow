import type { CSSProperties } from 'react'
import { Alert } from '../components/ui/Alert'

export function ConciliationPage() {
  return (
    <>
      <header style={pageHeaderStyle}>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Conciliação de Casos</h1>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
            Softflow × Azure DevOps
          </span>
        </div>
      </header>
      <div style={{ padding: '24px 32px' }}>
        <Alert tone="info">
          Fase futura (E6): BFF com token do Azure DevOps em variável de ambiente, endpoint
          `GET /conciliacao` e ação “Abrir branch”. Credenciais nunca ficam no navegador.
        </Alert>
      </div>
    </>
  )
}

const pageHeaderStyle: CSSProperties = {
  minHeight: 60,
  boxSizing: 'border-box',
  padding: '12px 32px',
  background: 'var(--surface-card)',
  borderBottom: '1px solid var(--border-default)',
  display: 'flex',
  alignItems: 'center',
}
