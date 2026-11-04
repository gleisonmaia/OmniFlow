import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { getProjetoMemoria, updateCaso } from '../api/casos'
import { ApiError } from '../api/client'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { minutesToHours } from '../lib/capacity'
import { daysSince, formatDate, formatHours } from '../lib/format'
import { useAuthStore } from '../store/authStore'
import { useContextStore } from '../store/contextStore'
import type { CasoMemoria, Totalizadores, UpdateCasoPayload } from '../types/api'

const TESTE_PENDENTE_DIAS = Number(import.meta.env.VITE_TESTE_PENDENTE_DIAS ?? 15)
const STATUS_CONCLUIDO = 9
const STATUS_SUSPENSO = 10
const STATUS_AGUARDANDO_TESTE = 3

type TileKey = 'all' | 'pendentes' | 'teste'

interface DraftFilters {
  tipoAbertura: string
  statusId: string
  prioridade: string
  busca: string
  dataInicio: string
  dataFim: string
}

function todayInputValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultFilters(): DraftFilters {
  const today = todayInputValue()
  return {
    tipoAbertura: '',
    statusId: '',
    prioridade: '',
    busca: '',
    dataInicio: today,
    dataFim: today,
  }
}

function priorityTone(priority?: string | null): 'critical' | 'warning' | 'info' | 'neutral' {
  const value = (priority ?? '').toLowerCase()
  if (value.includes('1') || value.includes('crít') || value.includes('crit')) return 'critical'
  if (value.includes('2') || value.includes('alta')) return 'warning'
  if (value.includes('3') || value.includes('média') || value.includes('media')) return 'info'
  return 'neutral'
}

export function ReportsPage() {
  const user = useAuthStore((s) => s.user)
  const statusList = useContextStore((s) => s.statusList)
  const projetoAtual = useContextStore((s) => s.projetoAtual)
  const projetoAtualLabel = useContextStore((s) => s.projetoAtualLabel)

  const [draft, setDraft] = useState<DraftFilters>(defaultFilters)
  const [applied, setApplied] = useState<DraftFilters>(defaultFilters)
  const [tile, setTile] = useState<TileKey>('all')
  const [items, setItems] = useState<CasoMemoria[]>([])
  const [totalizadores, setTotalizadores] = useState<Totalizadores>({})
  const [cursor, setCursor] = useState<string | null>(null)
  const [prevCursor, setPrevCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<CasoMemoria | null>(null)
  const [editResumo, setEditResumo] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [tileCounts, setTileCounts] = useState({ pendentes: 0, teste: 0 })

  const casoStatusOptions = useMemo(
    () => statusList.filter((s) => String(s.tipo_status).toUpperCase() === 'CASO' && !s.desativado),
    [statusList],
  )

  const loadList = useCallback(
    async (opts?: { cursor?: string | null; filters?: DraftFilters; tileFilter?: TileKey }) => {
      const filters = opts?.filters ?? applied
      const tileFilter = opts?.tileFilter ?? tile
      setLoading(true)
      setError(null)

      const query: Record<string, string | number | Array<string | number> | null | undefined> = {
        per_page: 15,
        sort_by: 'numero_caso',
        sort_order: 'desc',
        cursor: opts?.cursor ?? undefined,
        setor_projeto: user?.setor,
        tipo_abertura: filters.tipoAbertura || undefined,
        prioridade: filters.prioridade || undefined,
        descricao_resumo: filters.busca || undefined,
        data_abertura_inicio: filters.dataInicio || undefined,
        data_abertura_fim: filters.dataFim || undefined,
      }

      if (projetoAtual?.NumeroProjeto) {
        // projeto atual como filtro padrão quando disponível via projetos da API
      }

      if (filters.statusId) {
        query.status_id = filters.statusId
      } else if (tileFilter === 'pendentes') {
        // client-side filter after load when API doesn't support NOT IN; request all and filter
      } else if (tileFilter === 'teste') {
        query.status_id = STATUS_AGUARDANDO_TESTE
      }

      try {
        const response = await getProjetoMemoria(query)
        let data = response.data ?? []

        if (tileFilter === 'pendentes') {
          data = data.filter((item) => {
            const id = Number(item.caso.status?.status_id)
            return id !== STATUS_CONCLUIDO && id !== STATUS_SUSPENSO
          })
        }

        if (tileFilter === 'teste') {
          data = data.filter((item) => daysSince(item.caso.datas?.abertura) > TESTE_PENDENTE_DIAS)
        }

        setItems(data)
        setTotalizadores(response.totalizadores ?? {})
        setCursor(response.pagination?.next_cursor ?? null)
        setPrevCursor(response.pagination?.prev_cursor ?? null)
        setHasMore(Boolean(response.pagination?.has_more))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Falha ao carregar os casos.')
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [applied, tile, user?.setor, projetoAtual],
  )

  const loadTileCounts = useCallback(async () => {
    try {
      const [pendentesRes, testeRes] = await Promise.all([
        getProjetoMemoria({
          per_page: 1,
          setor_projeto: user?.setor,
        }),
        getProjetoMemoria({
          per_page: 50,
          setor_projeto: user?.setor,
          status_id: STATUS_AGUARDANDO_TESTE,
        }),
      ])

      const total = pendentesRes.totalizadores?.total_casos ?? 0
      // Approximate: we don't have NOT IN; show total - concluded estimate unavailable.
      // For MVP tiles, fetch a broader page for pendentes count via local filter of a summary call.
      const summary = await getProjetoMemoria({
        per_page: 100,
        setor_projeto: user?.setor,
        sort_by: 'numero_caso',
        sort_order: 'desc',
      })
      const pendentes = (summary.data ?? []).filter((item) => {
        const id = Number(item.caso.status?.status_id)
        return id !== STATUS_CONCLUIDO && id !== STATUS_SUSPENSO
      }).length

      const teste = (testeRes.data ?? []).filter(
        (item) => daysSince(item.caso.datas?.abertura) > TESTE_PENDENTE_DIAS,
      ).length

      setTileCounts({
        pendentes: pendentes || Math.max(total - (summary.totalizadores?.total_casos ? 0 : 0), pendentes),
        teste,
      })
    } catch {
      // tiles are secondary; ignore
    }
  }, [user?.setor])

  useEffect(() => {
    void loadList({ filters: applied, tileFilter: tile })
  }, [applied, tile, loadList])

  useEffect(() => {
    void loadTileCounts()
  }, [loadTileCounts])

  function handleSearch() {
    setApplied({ ...draft })
    setTile('all')
  }

  function handleClear() {
    const filters = defaultFilters()
    setDraft(filters)
    setApplied(filters)
    setTile('all')
  }

  function openEdit(item: CasoMemoria) {
    setEditing(item)
    setEditResumo(item.caso.textos?.descricao_resumo ?? '')
    setEditStatus(String(item.caso.status?.status_id ?? ''))
    setSaveError(null)
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    setSaveError(null)

    const payload: UpdateCasoPayload = {}
    const originalResumo = editing.caso.textos?.descricao_resumo ?? ''
    const originalStatus = String(editing.caso.status?.status_id ?? '')

    if (editResumo !== originalResumo) payload.descricao_resumo = editResumo
    if (editStatus && editStatus !== originalStatus) payload.status = editStatus

    if (Object.keys(payload).length === 0) {
      setEditing(null)
      setSaving(false)
      return
    }

    try {
      await updateCaso(editing.caso.id, payload)
      setEditing(null)
      await loadList()
      await loadTileCounts()
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Falha ao salvar o caso.')
    } finally {
      setSaving(false)
    }
  }

  const horasEstimadas = minutesToHours(totalizadores.tempo_total_estimado_minutos)

  return (
    <>
      <header style={pageHeaderStyle}>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Reports do Suporte</h1>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
            Triagem e acompanhamento dos casos Softflow
            {projetoAtual ? ` · ${projetoAtualLabel}` : ''}
          </span>
        </div>
      </header>

      <div style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {!projetoAtual ? (
          <Alert tone="warning">Sem projeto em andamento para a sua squad. A listagem usa o filtro de setor.</Alert>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <TileCard
            label="Total do filtro"
            value={String(totalizadores.total_casos ?? items.length)}
            sub={formatHours(horasEstimadas)}
            active={tile === 'all'}
            onClick={() => setTile('all')}
          />
          <TileCard
            label="Pendentes"
            value={String(tileCounts.pendentes)}
            sub="≠ Concluído/Suspenso"
            active={tile === 'pendentes'}
            color="var(--status-warning)"
            onClick={() => setTile('pendentes')}
          />
          <TileCard
            label="Teste pendente"
            value={String(tileCounts.teste)}
            sub={`> ${TESTE_PENDENTE_DIAS} dias`}
            active={tile === 'teste'}
            color="var(--status-critical)"
            onClick={() => setTile('teste')}
          />
        </div>

        <section
          aria-label="Filtros"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: 12,
          }}
        >
          <Field label="Tipo">
            <select
              value={draft.tipoAbertura}
              onChange={(e) => setDraft((d) => ({ ...d, tipoAbertura: e.target.value }))}
              style={selectStyle}
            >
              <option value="">Todos</option>
              <option value="CASO">CASO</option>
              <option value="REPORT">REPORT</option>
            </select>
          </Field>
          <Field label="Período · de">
            <input
              type="date"
              value={draft.dataInicio}
              onChange={(e) => setDraft((d) => ({ ...d, dataInicio: e.target.value }))}
              style={selectStyle}
            />
          </Field>
          <Field label="Período · até">
            <input
              type="date"
              value={draft.dataFim}
              onChange={(e) => setDraft((d) => ({ ...d, dataFim: e.target.value }))}
              style={selectStyle}
            />
          </Field>
          <Field label="Status">
            <select
              value={draft.statusId}
              onChange={(e) => setDraft((d) => ({ ...d, statusId: e.target.value }))}
              style={selectStyle}
            >
              <option value="">Todos</option>
              {casoStatusOptions.map((s) => (
                <option key={String(s.Registro)} value={String(s.Registro)}>
                  {s.tipo}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prioridade">
            <select
              value={draft.prioridade}
              onChange={(e) => setDraft((d) => ({ ...d, prioridade: e.target.value }))}
              style={selectStyle}
            >
              <option value="">Todas</option>
              <option value="1">1 - Crítica</option>
              <option value="2">2 - Alta</option>
              <option value="3">3 - Média</option>
              <option value="4">4 - Baixa</option>
            </select>
          </Field>
          <Field label="Busca">
            <input
              type="search"
              placeholder="Resumo do caso"
              value={draft.busca}
              onChange={(e) => setDraft((d) => ({ ...d, busca: e.target.value }))}
              style={selectStyle}
            />
          </Field>
          <button type="button" onClick={handleSearch} style={primaryBtnStyle}>
            Buscar
          </button>
          <button type="button" onClick={handleClear} style={secondaryBtnStyle}>
            Limpar filtros
          </button>
        </section>

        {error ? (
          <Alert actionLabel="Tentar de novo" onAction={() => void loadList()}>
            {error}
          </Alert>
        ) : null}

        <section
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, flexGrow: 1, fontSize: 14, fontWeight: 700 }}>
              Fila de casos{' '}
              <span style={{ fontWeight: 600, color: 'var(--ink-muted)' }}>
                · {totalizadores.total_casos ?? items.length} no filtro
              </span>
            </h2>
            {loading ? <Spinner /> : null}
          </div>

          <div style={{ overflow: 'auto', maxHeight: 560 }}>
            <table style={{ width: '100%', minWidth: 1000, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--ink-muted)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  <th style={thStyle}>Caso</th>
                  <th style={thStyle}>Produto</th>
                  <th style={thStyle}>Resumo</th>
                  <th style={thStyle}>Dev</th>
                  <th style={thStyle}>Prioridade</th>
                  <th style={thStyle}>Status Flow</th>
                  <th style={thStyle}>Abertura</th>
                  <th style={thStyle}>Horas</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={String(item.caso.id)} style={{ borderTop: '1px solid var(--border-default)' }}>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      #{item.caso.id}
                    </td>
                    <td style={tdStyle}>
                      {item.produto?.nome ?? '—'}
                      {item.produto?.versao ? (
                        <div style={{ color: 'var(--icon-muted)', fontSize: 12 }}>{item.produto.versao}</div>
                      ) : null}
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 340 }}>
                      {item.caso.textos?.descricao_resumo ?? '—'}
                      {item.caso.flags?.duplicado ? (
                        <>
                          {' '}
                          <Badge tone="info">Duplicado</Badge>
                        </>
                      ) : null}
                    </td>
                    <td style={tdStyle}>{item.caso.usuarios?.desenvolvimento?.nome ?? '—'}</td>
                    <td style={tdStyle}>
                      <Badge tone={priorityTone(item.caso.caracteristicas?.prioridade)}>
                        {item.caso.caracteristicas?.prioridade ?? '—'}
                      </Badge>
                    </td>
                    <td style={tdStyle}>
                      <Badge tone="neutral">{item.caso.status?.status_tipo ?? '—'}</Badge>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(item.caso.datas?.abertura)}
                    </td>
                    <td style={tdStyle}>
                      {formatHours(minutesToHours(item.caso.tempos?.estimado_minutos))}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button type="button" onClick={() => openEdit(item)} style={rowBtnStyle}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                      Nenhum caso para os filtros selecionados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <button
              type="button"
              disabled={!prevCursor || loading}
              onClick={() => void loadList({ cursor: prevCursor })}
              style={secondaryBtnStyle}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={!hasMore || loading}
              onClick={() => void loadList({ cursor })}
              style={secondaryBtnStyle}
            >
              Próximo
            </button>
          </div>
        </section>
      </div>

      {editing ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editar caso"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 22, 31, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 50,
            padding: 24,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#fff',
              borderRadius: 12,
              border: '1px solid var(--border-default)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16 }}>Editar caso #{editing.caso.id}</h2>
            <Field label="Resumo">
              <textarea
                value={editResumo}
                onChange={(e) => setEditResumo(e.target.value)}
                rows={4}
                style={{ ...selectStyle, height: 'auto', padding: 10, resize: 'vertical' }}
              />
            </Field>
            <Field label="Status Flow">
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={selectStyle}>
                {casoStatusOptions.map((s) => (
                  <option key={String(s.Registro)} value={String(s.Registro)}>
                    {s.tipo}
                  </option>
                ))}
              </select>
            </Field>
            {saveError ? <Alert>{saveError}</Alert> : null}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setEditing(null)} style={secondaryBtnStyle} disabled={saving}>
                Cancelar
              </button>
              <button type="button" onClick={() => void handleSave()} style={primaryBtnStyle} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function TileCard({
  label,
  value,
  sub,
  active,
  onClick,
  color = 'var(--ink)',
}: {
  label: string
  value: string
  sub: string
  active: boolean
  onClick: () => void
  color?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        textAlign: 'left',
        background: 'var(--surface-card)',
        border: active ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
        {label}
      </span>
      <span style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color }}>{value}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-muted)' }}>{sub}</span>
    </button>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ flex: '1 1 140px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
      {label}
      {children}
    </label>
  )
}

const pageHeaderStyle: CSSProperties = {
  minHeight: 60,
  boxSizing: 'border-box',
  padding: '12px 32px',
  background: 'var(--surface-card)',
  borderBottom: '1px solid var(--border-default)',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 16,
}

const selectStyle: CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 8px',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  background: '#FFFFFF',
  font: "400 14px 'Plus Jakarta Sans', sans-serif",
  color: 'var(--ink)',
  boxSizing: 'border-box',
}

const primaryBtnStyle: CSSProperties = {
  flex: '0 0 auto',
  height: 44,
  padding: '0 16px',
  border: 0,
  borderRadius: 8,
  background: 'var(--ink)',
  color: '#FFFFFF',
  font: "700 14px 'Plus Jakarta Sans', sans-serif",
  cursor: 'pointer',
}

const secondaryBtnStyle: CSSProperties = {
  flex: '0 0 auto',
  height: 44,
  padding: '0 14px',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  background: '#FFFFFF',
  color: 'var(--ink)',
  font: "600 14px 'Plus Jakarta Sans', sans-serif",
  cursor: 'pointer',
}

const rowBtnStyle: CSSProperties = {
  height: 30,
  padding: '0 12px',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  background: '#FFFFFF',
  color: 'var(--accent-primary-hover)',
  font: "700 12px 'Plus Jakarta Sans', sans-serif",
  cursor: 'pointer',
}

const thStyle: CSSProperties = { padding: '11px 14px', fontWeight: 700 }
const tdStyle: CSSProperties = { padding: '11px 14px' }
