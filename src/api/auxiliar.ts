import type {
  Projeto,
  ProjetosAtivosResponse,
  StatusItem,
  UsuarioSquad,
} from '../types/api'
import { apiRequest } from './client'

export function getProjetos(params: {
  usuario_id: string | number
  setor_projeto: string
  incluir_fechados?: boolean
  search?: string
}) {
  return apiRequest<Projeto[]>('/auxiliar/projetos', {
    query: {
      usuario_id: params.usuario_id,
      setor_projeto: params.setor_projeto,
      incluir_fechados: params.incluir_fechados ? 'true' : undefined,
      search: params.search,
    },
  })
}

export function getProjetosAtivos(setor: string) {
  return apiRequest<ProjetosAtivosResponse>('/auxiliar/sgp-projetos-ativos', {
    query: { setor },
  })
}

export function getStatusList() {
  return apiRequest<StatusItem[]>('/auxiliar/status')
}

export function getUsuarios(setor: string) {
  return apiRequest<UsuarioSquad[]>('/auxiliar/usuarios', {
    query: { setor },
  })
}
