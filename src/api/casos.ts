import type {
  ProjetoMemoriaParams,
  ProjetoMemoriaResponse,
  UpdateCasoPayload,
  UpdateCasoResponse,
} from '../types/api'
import { apiRequest } from './client'

export function getProjetoMemoria(params: ProjetoMemoriaParams = {}) {
  return apiRequest<ProjetoMemoriaResponse>('/projeto-memoria', {
    query: params,
  })
}

export function updateCaso(id: string | number, payload: UpdateCasoPayload) {
  return apiRequest<UpdateCasoResponse>(`/projeto-casos/${id}`, {
    method: 'PUT',
    body: payload,
  })
}
