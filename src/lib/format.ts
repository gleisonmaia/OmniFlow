export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatHours(hours: number) {
  return `${hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h`
}

export function initials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function safeProjectLabel(numero?: string | number | null, nome?: string | null) {
  if (!numero && !nome) return 'Sem projeto em andamento'
  if (numero && nome) return `${numero} | ${nome}`
  return String(numero ?? nome)
}

export function daysSince(value?: string | null) {
  if (!value) return 0
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return 0
  const diff = Date.now() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
