import type { LoginResponse } from '../types/api'
import { apiRequest } from './client'

export function login(usuario: string, senha: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { usuario, senha },
    auth: false,
  })
}
