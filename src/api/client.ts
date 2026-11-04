const DEFAULT_TIMEOUT_MS = 10_000

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null
let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken() {
  return authToken
}

export function onUnauthorized(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

function getBaseUrl() {
  return (import.meta.env.VITE_SOFTFLOW_BASE_URL as string | undefined) ?? '/api-soft-flow/api'
}

function buildUrl(path: string, query?: Record<string, string | number | Array<string | number> | null | undefined>) {
  const base = getBaseUrl().replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${base}${normalized}`, window.location.origin)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, String(item))
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

function extractMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback
  const record = body as Record<string, unknown>
  if (typeof record.message === 'string' && record.message.trim()) return record.message
  if (typeof record.error === 'string' && record.error.trim()) return record.error
  return fallback
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string
    body?: unknown
    query?: Record<string, string | number | Array<string | number> | null | undefined>
    auth?: boolean
    timeoutMs?: number
  } = {},
): Promise<T> {
  const { method = 'GET', body, query, auth = true, timeoutMs = DEFAULT_TIMEOUT_MS } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth && authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })

    let parsed: unknown = null
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      parsed = await response.json()
    } else {
      const text = await response.text()
      parsed = text ? { message: text } : null
    }

    if (response.status === 401) {
      unauthorizedHandler?.()
      throw new ApiError('Sessão expirada. Faça login novamente.', 401, parsed)
    }

    if (response.status === 503) {
      throw new ApiError('API Softflow indisponível no momento. Tente novamente em instantes.', 503, parsed)
    }

    if (!response.ok) {
      throw new ApiError(extractMessage(parsed, `Erro ${response.status}`), response.status, parsed)
    }

    return parsed as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('A requisição excedeu o tempo limite.', 408)
    }
    throw new ApiError('Não foi possível conectar à API Softflow.', 0, error)
  } finally {
    window.clearTimeout(timer)
  }
}
