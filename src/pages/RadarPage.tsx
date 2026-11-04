import type { CSSProperties } from 'react'
import { Alert } from '../components/ui/Alert'

export function RadarPage() {
  return (
    <>
      <header style={pageHeaderStyle}>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Radar Fiscal</h1>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
            Coleta externa com banco e API próprios
          </span>
        </div>
      </header>
      <div style={{ padding: '24px 32px' }}>
        <Alert tone="info">
          Fase futura (E5): backend local, tabelas `itens`/`coletas` e endpoints `/radar/*`. A tela
          só lerá do banco do Radar — nunca direto da fonte webscraped.
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
