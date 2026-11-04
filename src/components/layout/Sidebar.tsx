import type { CSSProperties } from 'react'
import { NavLink } from 'react-router-dom'
import { OmniFlowLogo } from '../OmniFlowLogo'
import { useAuthStore } from '../../store/authStore'
import { useContextStore } from '../../store/contextStore'

const modules = [
  {
    to: '/reports',
    name: 'Reports do Suporte',
    d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  },
  {
    to: '/distribuicao',
    name: 'Squad e Capacidade',
    d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  },
  {
    to: '/radar',
    name: 'Radar Fiscal',
    d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    future: true,
  },
  {
    to: '/conciliacao',
    name: 'Conciliação',
    d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    future: true,
  },
]

const linkBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  margin: '0 12px',
  padding: '10px 12px',
  borderRadius: 8,
  color: '#94A3B8',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 600,
}

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const projetoAtualLabel = useContextStore((s) => s.projetoAtualLabel)
  const contextError = useContextStore((s) => s.error)
  const retry = useContextStore((s) => s.retry)

  return (
    <nav
      aria-label="Módulos do OmniFlow"
      style={{
        flex: '0 0 var(--sidebar-width)',
        width: 'var(--sidebar-width)',
        background: 'var(--surface-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          height: 76,
          boxSizing: 'border-box',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface-sidebar-header)',
          borderBottom: '1px solid var(--border-sidebar)',
        }}
      >
        <OmniFlowLogo />
      </div>

      <span
        style={{
          padding: '20px 20px 8px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#5B6474',
        }}
      >
        Módulos
      </span>

      {modules.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            ...linkBase,
            background: isActive ? 'rgba(245, 158, 11, 0.14)' : 'transparent',
            color: isActive ? 'var(--accent-gold)' : '#94A3B8',
          })}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={item.d} />
          </svg>
          <span style={{ flexGrow: 1 }}>{item.name}</span>
          {item.future ? (
            <span
              style={{
                minWidth: 22,
                height: 20,
                padding: '0 6px',
                boxSizing: 'border-box',
                borderRadius: 999,
                background: 'var(--border-sidebar)',
                color: '#94A3B8',
                fontSize: 10,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Em breve
            </span>
          ) : null}
        </NavLink>
      ))}

      <div
        style={{
          marginTop: 'auto',
          padding: '16px 20px',
          borderTop: '1px solid var(--border-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          fontSize: 13,
          color: '#94A3B8',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Squad
          </span>
          <span style={{ color: '#F1F3F6', fontWeight: 600 }}>{user?.setor || '—'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Projeto atual
          </span>
          <span style={{ color: '#F1F3F6', fontWeight: 600 }}>{projetoAtualLabel}</span>
          {contextError ? (
            <button
              type="button"
              onClick={retry}
              style={{
                marginTop: 4,
                alignSelf: 'flex-start',
                border: 0,
                background: 'transparent',
                color: 'var(--accent-gold)',
                font: 'inherit',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Tentar de novo
            </button>
          ) : null}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            paddingTop: 10,
            borderTop: '1px solid var(--border-sidebar)',
          }}
        >
          <span style={{ color: '#F1F3F6' }}>{user?.nome || '—'}</span>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              border: 0,
              background: 'transparent',
              color: '#94A3B8',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
