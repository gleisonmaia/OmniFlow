import type { CSSProperties, ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  tone?: 'critical' | 'warning' | 'info' | 'neutral' | 'success' | 'gold'
}

const toneStyles: Record<NonNullable<BadgeProps['tone']>, CSSProperties> = {
  critical: { background: 'var(--status-critical-bg)', color: 'var(--status-critical)' },
  warning: { background: 'var(--status-warning-bg)', color: 'var(--status-warning)' },
  info: { background: 'var(--status-info-bg)', color: 'var(--status-info)' },
  neutral: { background: 'var(--status-neutral-bg)', color: 'var(--status-neutral)' },
  success: { background: '#ecfdf5', color: 'var(--status-success)' },
  gold: { background: 'var(--accent-gold)', color: 'var(--ink)' },
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      style={{
        height: 20,
        padding: '0 8px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 11,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        ...toneStyles[tone],
      }}
    >
      {children}
    </span>
  )
}
