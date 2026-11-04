import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { getProjetoMemoria, updateCaso } from '../api/casos'
import { ApiError } from '../api/client'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import {
  getCapacityBand,
  getCapacityHours,
  getCapacityPercent,
  minutesToHours,
} from '../lib/capacity'
import { formatHours, initials } from '../lib/format'
import { useAuthStore } from '../store/authStore'
import { useContextStore } from '../store/contextStore'
import type { CapacityBand, CasoMemoria, UsuarioSquad } from '../types/api'

interface DevColumn {
  id: string
  name: string
  hours: number
  band: CapacityBand
  cases: CasoMemoria[]
}

export function DistributionPage() {
  const user = useAuthStore((s) => s.user)
  const projetos = useContextStore((s) => s.projetos)
  const projetoAtual = useContextStore((s) => s.projetoAtual)
  const usuarios = useContextStore((s) => s.usuarios)

  const defaultProjeto = useMemo(() => {
    if (projetoAtual?.NumeroProjeto != null) {
      const match = projetos.find(
        (p) => String(p.numero_projeto) === String(projetoAtual.NumeroProjeto),
      )
      return match ? String(match.id) : ''
    }
    return projetos[0] ? String(projetos[0].id) : ''
  }, [projetoAtual, projetos])

  const [projetoId, setProjetoId] = useState('')
  const [columns, setColumns] = useState<DevColumn[]>([])
  const [unassigned, setUnassigned] = useState<CasoMemoria[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!projetoId && defaultProjeto) setProjetoId(defaultProjeto)
  }, [defaultProjeto, projetoId])

  const capacity = getCapacityHours()

  const loadBoard = useCallback(async () => {
    if (!projetoId) {
      setColumns([])
      setUnassigned([])
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await getProjetoMemoria({
        projeto_id: projetoId,
        setor_projeto: user?.setor,
        per_page: 100,
        sort_by: 'numero_caso',
        sort_order: 'asc',
      })

      const cases = response.data ?? []
      const byDev = new Map<string, CasoMemoria[]>()
      const free: CasoMemoria[] = []

      for (const item of cases) {
        const devId = item.caso.usuarios?.desenvolvimento?.id
        const hasDev = devId != null && String(devId) !== '0' && String(devId) !== ''
        if (!hasDev) {
          free.push(item)
          continue
        }
        const key = String(devId)
        const list = byDev.get(key) ?? []
        list.push(item)
        byDev.set(key, list)
      }

      const people: UsuarioSquad[] =
        usuarios.length > 0
          ? usuarios
          : Array.from(byDev.entries()).map(([id, list]) => ({
              id,
              nome_suporte: list[0]?.caso.usuarios?.desenvolvimento?.nome || `DEV ${id}`,
            }))

      // Capacity via totalizadores per DEV (proposed API usage)
      const hourEntries = await Promise.all(
        people.map(async (person) => {
          try {
            const res = await getProjetoMemoria({
              projeto_id: projetoId,
              usuario_dev_id: person.id,
              per_page: 1,
            })
            return {
              id: String(person.id),
              minutes: res.totalizadores?.tempo_total_estimado_minutos ?? 0,
            }
          } catch {
            const list = byDev.get(String(person.id)) ?? []
            const minutes = list.reduce(
              (sum, c) => sum + (Number(c.caso.tempos?.estimado_minutos) || 0),
              0,
            )
            return { id: String(person.id), minutes }
          }
        }),
      )

      const hoursByDev = new Map(hourEntries.map((e) => [e.id, minutesToHours(e.minutes)]))

      const nextColumns: DevColumn[] = people.map((person) => {
        const id = String(person.id)
        const hours = hoursByDev.get(id) ?? 0
        return {
          id,
          name: person.nome_suporte,
          hours,
          band: getCapacityBand(hours, capacity),
          cases: byDev.get(id) ?? [],
        }
      })

      // Keep DEVs that have cases even if not in usuarios list
      for (const [id, list] of byDev.entries()) {
        if (!nextColumns.some((c) => c.id === id)) {
          const hours =
            minutesToHours(list.reduce((s, c) => s + (Number(c.caso.tempos?.estimado_minutos) || 0), 0))
          nextColumns.push({
            id,
            name: list[0]?.caso.usuarios?.desenvolvimento?.nome || `DEV ${id}`,
            hours,
            band: getCapacityBand(hours, capacity),
            cases: list,
          })
        }
      }

      setColumns(nextColumns)
      setUnassigned(free)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar a distribuição.')
      setColumns([])
      setUnassigned([])
    } finally {
      setLoading(false)
    }
  }, [projetoId, user?.setor, usuarios, capacity])

  useEffect(() => {
    void loadBoard()
  }, [loadBoard])

  async function moveCase(caseId: string, toDevId: string | null) {
    const fromColumn = columns.find((c) => c.cases.some((x) => String(x.caso.id) === caseId))
    const unassignedItem = unassigned.find((x) => String(x.caso.id) === caseId)
    const item = fromColumn?.cases.find((x) => String(x.caso.id) === caseId) ?? unassignedItem
    if (!item) return

    const previousColumns = columns
    const previousUnassigned = unassigned

    // Optimistic UI
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        cases: [
          ...col.cases.filter((c) => String(c.caso.id) !== caseId),
          ...(toDevId && col.id === toDevId
            ? [
                {
                  ...item,
                  caso: {
                    ...item.caso,
                    usuarios: {
                      ...item.caso.usuarios,
                      desenvolvimento: {
                        id: toDevId,
                        nome: col.name,
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      })),
    )
    setUnassigned((list) =>
      toDevId
        ? list.filter((c) => String(c.caso.id) !== caseId)
        : [...list.filter((c) => String(c.caso.id) !== caseId), item],
    )

    try {
      await updateCaso(caseId, { atribuido_para: toDevId })
      setMessage(`Caso #${caseId} redistribuído.`)
      await loadBoard()
    } catch (err) {
      setColumns(previousColumns)
      setUnassigned(previousUnassigned)
      setError(err instanceof ApiError ? err.message : 'Falha ao mover o caso. Alteração desfeita.')
    }
  }

  return (
    <>
      <header style={pageHeaderStyle}>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Distribuição de Casos</h1>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
            Capacidade alvo {capacity}h ± 15% por DEV
          </span>
        </div>
        {loading ? <Spinner /> : null}
      </header>

      <div style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <section
          aria-label="Filtros"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: 12,
          }}
        >
          <label style={{ flex: '3 1 260px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
            Projeto
            <select
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Selecione</option>
              {projetos.map((p) => (
                <option key={String(p.id)} value={String(p.id)}>
                  {p.numero_projeto} | {p.nome_projeto}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => void loadBoard()} style={secondaryBtnStyle}>
            Atualizar
          </button>
        </section>

        {error ? (
          <Alert actionLabel="Tentar de novo" onAction={() => void loadBoard()}>
            {error}
          </Alert>
        ) : null}
        {message ? <Alert tone="success">{message}</Alert> : null}
        {!projetoId ? <Alert tone="warning">Selecione um projeto para ver a distribuição.</Alert> : null}

        <section aria-label="Casos por colaborador" style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'stretch',
              gap: 12,
              width: 'max-content',
              minWidth: '100%',
              height: 'calc(100vh - 260px)',
              minHeight: 320,
            }}
          >
            <BoardColumn
              title="Sem DEV"
              subtitle="Não atribuídos"
              hours={minutesToHours(
                unassigned.reduce((s, c) => s + (Number(c.caso.tempos?.estimado_minutos) || 0), 0),
              )}
              band={null}
              cases={unassigned}
              capacity={capacity}
              draggingId={draggingId}
              onDragStart={setDraggingId}
              onDragEnd={() => setDraggingId(null)}
              onDrop={() => {
                if (draggingId) void moveCase(draggingId, null)
                setDraggingId(null)
              }}
            />
            {columns.map((col) => (
              <BoardColumn
                key={col.id}
                title={col.name}
                subtitle="DEV"
                hours={col.hours}
                band={col.band}
                cases={col.cases}
                capacity={capacity}
                draggingId={draggingId}
                onDragStart={setDraggingId}
                onDragEnd={() => setDraggingId(null)}
                onDrop={() => {
                  if (draggingId) void moveCase(draggingId, col.id)
                  setDraggingId(null)
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

function BoardColumn({
  title,
  subtitle,
  hours,
  band,
  cases,
  capacity,
  draggingId,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  title: string
  subtitle: string
  hours: number
  band: CapacityBand | null
  cases: CasoMemoria[]
  capacity: number
  draggingId: string | null
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDrop: () => void
}) {
  const pct = getCapacityPercent(hours, capacity)
  const fillColor =
    band === 'Sobrecarga'
      ? 'var(--capacity-overload)'
      : band === 'Ocioso'
        ? 'var(--capacity-idle)'
        : 'var(--capacity-ideal)'

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
      style={{
        flex: '1 0 190px',
        minWidth: 190,
        maxWidth: 260,
        minHeight: 0,
        height: '100%',
        boxSizing: 'border-box',
        background: '#E9ECF1',
        borderRadius: 12,
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        outline: draggingId ? '1px dashed var(--accent-primary)' : undefined,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          background: '#FFFFFF',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: 'var(--status-info-bg)',
              color: 'var(--status-info)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {initials(title)}
          </span>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: 14, lineHeight: 1.25 }}>{title}</strong>
            <span style={{ fontSize: 12, color: 'var(--icon-muted)' }}>{subtitle}</span>
          </div>
        </div>

        {band ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {formatHours(hours)} de {capacity}h
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: '#EEF1F5', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: fillColor }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Badge
                tone={band === 'Sobrecarga' ? 'critical' : band === 'Ocioso' ? 'success' : 'info'}
              >
                {band}
              </Badge>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{cases.length} casos</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800 }}>
              {cases.length} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)' }}>casos</span>
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatHours(hours)} estimadas</span>
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingRight: 2,
        }}
      >
        {cases.map((c) => (
          <article
            key={String(c.caso.id)}
            draggable
            onDragStart={() => onDragStart(String(c.caso.id))}
            onDragEnd={onDragEnd}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: '6px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              boxShadow: '0 1px 2px rgba(18, 22, 31, .06)',
              cursor: 'grab',
              opacity: draggingId === String(c.caso.id) ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--status-info)' }}>
                #{c.caso.id}
              </span>
              <Badge tone="neutral">{c.caso.caracteristicas?.tipo_abertura ?? 'CASO'}</Badge>
              <span style={{ marginLeft: 'auto' }}>
                <Badge tone="info">{c.caso.status?.status_tipo ?? '—'}</Badge>
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.25 }}>
              {c.caso.textos?.descricao_resumo ?? 'Sem resumo'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-muted)' }}>
              <span style={{ flexGrow: 1 }}>{c.produto?.nome ?? '—'}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {c.caso.caracteristicas?.tamanho_pontos ?? 0} pts ·{' '}
                {formatHours(minutesToHours(c.caso.tempos?.estimado_minutos))}
              </span>
            </div>
          </article>
        ))}

        {cases.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
            Solte um caso aqui
          </div>
        ) : null}
      </div>
    </div>
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
  padding: '0 10px',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  background: '#FFFFFF',
  font: "400 14px 'Plus Jakarta Sans', sans-serif",
  color: 'var(--ink)',
  boxSizing: 'border-box',
}

const secondaryBtnStyle: CSSProperties = {
  flex: '0 0 auto',
  height: 44,
  padding: '0 16px',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  background: '#FFFFFF',
  color: 'var(--ink)',
  font: "600 14px 'Plus Jakarta Sans', sans-serif",
  cursor: 'pointer',
}
