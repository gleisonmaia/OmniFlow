import type { ReactNode } from 'react'

interface AlertProps {
  tone?: 'error' | 'warning' | 'success' | 'info'
  children: ReactNode
  actionLabel?: string
  onAction?: () => void
}

const tones = {
  error: {
    background: 'var(--status-critical-bg)',
    color: 'var(--status-critical)',
  },
  warning: {
    background: 'var(--status-warning-bg)',
    color: 'var(--status-warning)',
  },
  success: {
    background: '#ecfdf5',
    color: 'var(--status-success)',
  },
  info: {
    background: 'var(--status-info-bg)',
    color: 'var(--status-info)',
  },
}

export function Alert({ tone = 'error', children, actionLabel, onAction }: AlertProps) {
  const style = tones[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        boxSizing: 'border-box',
        background: style.background,
        color: style.color,
        borderRadius: 'var(--radius-md)',
        padding: 12,
        fontSize: 13,
        lineHeight: '18px',
        fontWeight: 600,
      }}
    >
      <span>{children}</span>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          style={{
            border: 0,
            background: 'transparent',
            color: 'inherit',
            font: 'inherit',
            fontWeight: 800,
            cursor: 'pointer',
            textDecoration: 'underline',
            whiteSpace: 'nowrap',
          }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
