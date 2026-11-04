export interface SoftflowUser {
  id: number | string
  nome: string
  usuario: string
  setor: string
  supervisor_id?: number | string | null
  tipo_registro?: string
}

export interface LoginResponse {
  success: boolean
  message?: string
  error?: string
  authorization?: {
    token: string
    type?: string
  }
  user?: SoftflowUser
  permissoes?: {
    permissoes_ativas?: string[]
  }
}

export interface Projeto {
  id: number | string
  numero_projeto: number | string
  nome_projeto: string
  data_inicial?: string
  data_final?: string
  setor?: string
  status?: string
}

export interface ProjetoAtivo {
  NumeroProjeto: number | string
  NomeProjeto: string
  DataInicial?: string
  DataFinal?: string
  Setor?: string
  Status?: string
}

export interface ProjetosAtivosResponse {
  success: boolean
  data: ProjetoAtivo[]
  filtro?: unknown
  total: number
}

export interface UsuarioSquad {
  id: number | string
  nome_suporte: string
  setor?: string
  supervisor_id?: number | string | null
  usuario?: string
}

export interface StatusItem {
  Registro: number | string
  tipo: string
  tipo_status: 'CASO' | 'REPORT' | string
  estado_equivalente?: number | string
  resolucao_equivalente?: number | string
  report_status_equivalente?: string | null
  report_definir_conclusao?: boolean | number | string | null
  permissao_funcoes_liberadas?: string
  permissao_adm?: boolean | number | string | null
  desativado?: boolean | number | string | null
}

export interface CasoUsuario {
  id?: number | string | null
  nome?: string | null
  setor_dev?: string | null
}

export interface CasoMemoria {
  caso: {
    id: number | string
    dias_no_backlog?: number | null
    datas?: {
      abertura?: string | null
      conclusao_dev?: string | null
      conclusao_qa?: string | null
      prazo_conclusao?: string | null
    }
    usuarios?: {
      desenvolvimento?: CasoUsuario | null
      qa?: CasoUsuario | null
      relator?: CasoUsuario | null
      abertura?: CasoUsuario | null
    }
    textos?: {
      descricao_resumo?: string | null
      descricao_completa?: string | null
    }
    tempos?: {
      estimado_minutos?: number | null
      realizado_minutos?: number | null
    }
    status?: {
      status_id?: number | string | null
      status_tipo?: string | null
      descricao?: string | null
      estado?: string | null
      resolucao?: string | null
    }
    caracteristicas?: {
      prioridade?: string | null
      tipo_categoria?: string | null
      tamanho_pontos?: number | null
      tipo_abertura?: string | null
    }
    flags?: {
      nao_planejado?: boolean
      bloqueado?: boolean
      entregue?: boolean
      liberacao?: boolean
      duplicado?: boolean
    }
    relacionamentos?: {
      id_caso_pai?: number | string | null
    }
    cliente?: string | null
  }
  projeto?: {
    id?: number | string
    descricao?: string
    setores?: {
      setor_projeto?: string
    }
  }
  produto?: {
    id?: number | string
    nome?: string | null
    versao?: string | null
  }
  report?: {
    sla?: string | null
    responsavel_feedback_nome?: string | null
  }
}

export interface Pagination {
  per_page: number
  next_cursor?: string | null
  prev_cursor?: string | null
  has_more: boolean
}

export interface Totalizadores {
  total_casos?: number
  casos_planejados?: number
  casos_nao_planejados?: number
  tempo_total_estimado_minutos?: number
  tempo_total_realizado_minutos?: number
  total_pontos?: number
  custo_estimado_ponto?: number
  custo_real_ponto?: number
}

export interface ProjetoMemoriaResponse {
  success: boolean
  data: CasoMemoria[]
  pagination: Pagination
  totalizadores: Totalizadores
  message?: string
  error?: string
}

export interface UpdateCasoPayload {
  atribuido_para?: number | string | null
  atribuido_qa?: number | string | null
  status?: number | string
  descricao_resumo?: string
  tempo_estimado?: number | string
  prioridade?: string
  [key: string]: unknown
}

export interface UpdateCasoResponse {
  success: boolean
  message?: string
  error?: string
  data?: unknown
  report?: unknown
}

export type CapacityBand = 'Ocioso' | 'Ideal' | 'Sobrecarga'

export interface ProjetoMemoriaParams {
  per_page?: number
  cursor?: string | null
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  numero_caso?: string | number
  descricao_resumo?: string
  status_id?: string | number | Array<string | number>
  prioridade?: string
  tipo_abertura?: string
  usuario_dev_id?: string | number
  usuario_qa_id?: string | number
  setor?: string
  setor_dev?: string
  setor_projeto?: string
  projeto_id?: string | number
  produto_nome?: string
  versao_produto?: string
  data_abertura_inicio?: string
  data_abertura_fim?: string
  data_producao_inicio?: string
  data_producao_fim?: string
  [key: string]: string | number | Array<string | number> | null | undefined
}
