import { create } from 'zustand'
import { login as loginRequest } from '../api/auth'
import { ApiError, setAuthToken } from '../api/client'
import type { SoftflowUser } from '../types/api'

const SESSION_KEY = 'omniflow.session'

interface SessionPayload {
  token: string
  user: SoftflowUser
  permissoesAtivas: string[]
}

interface AuthState {
  token: string | null
  user: SoftflowUser | null
  permissoesAtivas: string[]
  bootstrapped: boolean
  sessionMessage: string | null
  hydrate: () => void
  login: (usuario: string, senha: string) => Promise<void>
  logout: (message?: string | null) => void
  clearSessionMessage: () => void
}

function readSession(): SessionPayload | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionPayload
  } catch {
    return null
  }
}

function writeSession(payload: SessionPayload | null) {
  if (!payload) {
    sessionStorage.removeItem(SESSION_KEY)
    return
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  permissoesAtivas: [],
  bootstrapped: false,
  sessionMessage: null,

  hydrate: () => {
    const session = readSession()
    if (session?.token && session.user) {
      setAuthToken(session.token)
      set({
        token: session.token,
        user: session.user,
        permissoesAtivas: session.permissoesAtivas ?? [],
        bootstrapped: true,
      })
      return
    }
    setAuthToken(null)
    set({ token: null, user: null, permissoesAtivas: [], bootstrapped: true })
  },

  login: async (usuario, senha) => {
    const response = await loginRequest(usuario, senha)
    if (!response.success || !response.authorization?.token || !response.user) {
      throw new ApiError(response.message || response.error || 'Falha no login.', 400, response)
    }

    const payload: SessionPayload = {
      token: response.authorization.token,
      user: response.user,
      permissoesAtivas: response.permissoes?.permissoes_ativas ?? [],
    }

    writeSession(payload)
    setAuthToken(payload.token)
    set({
      token: payload.token,
      user: payload.user,
      permissoesAtivas: payload.permissoesAtivas,
      sessionMessage: null,
    })
  },

  logout: (message = null) => {
    writeSession(null)
    setAuthToken(null)
    set({
      token: null,
      user: null,
      permissoesAtivas: [],
      sessionMessage: message,
    })
  },

  clearSessionMessage: () => set({ sessionMessage: null }),
}))
