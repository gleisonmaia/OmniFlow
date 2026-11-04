import { create } from 'zustand'
import { getProjetos, getProjetosAtivos, getStatusList, getUsuarios } from '../api/auxiliar'
import { ApiError } from '../api/client'
import { safeProjectLabel } from '../lib/format'
import type { Projeto, ProjetoAtivo, StatusItem, UsuarioSquad } from '../types/api'

interface ContextState {
  loading: boolean
  error: string | null
  projetos: Projeto[]
  projetoAtual: ProjetoAtivo | null
  projetoAtualLabel: string
  statusList: StatusItem[]
  usuarios: UsuarioSquad[]
  load: (usuarioId: string | number, setor: string) => Promise<void>
  retry: () => void
  lastUsuarioId: string | number | null
  lastSetor: string | null
}

export const useContextStore = create<ContextState>((set, get) => ({
  loading: false,
  error: null,
  projetos: [],
  projetoAtual: null,
  projetoAtualLabel: 'Sem projeto em andamento',
  statusList: [],
  usuarios: [],
  lastUsuarioId: null,
  lastSetor: null,

  load: async (usuarioId, setor) => {
    set({ loading: true, error: null, lastUsuarioId: usuarioId, lastSetor: setor })
    try {
      const [projetos, ativos, statusList, usuarios] = await Promise.all([
        getProjetos({ usuario_id: usuarioId, setor_projeto: setor }),
        getProjetosAtivos(setor),
        getStatusList(),
        getUsuarios(setor),
      ])

      const projetoAtual = ativos.data?.[0] ?? null
      set({
        loading: false,
        projetos: Array.isArray(projetos) ? projetos : [],
        projetoAtual,
        projetoAtualLabel: projetoAtual
          ? safeProjectLabel(projetoAtual.NumeroProjeto, projetoAtual.NomeProjeto)
          : 'Sem projeto em andamento',
        statusList: Array.isArray(statusList) ? statusList : [],
        usuarios: Array.isArray(usuarios) ? usuarios : [],
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar o contexto da squad.'
      set({ loading: false, error: message })
    }
  },

  retry: () => {
    const { lastUsuarioId, lastSetor, load } = get()
    if (lastUsuarioId != null && lastSetor) {
      void load(lastUsuarioId, lastSetor)
    }
  },
}))
