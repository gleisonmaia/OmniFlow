import { useState, type CSSProperties, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { OmniFlowLogo } from '../components/OmniFlowLogo'
import { Alert } from '../components/ui/Alert'
import { Spinner } from '../components/ui/Spinner'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const login = useAuthStore((s) => s.login)
  const sessionMessage = useAuthStore((s) => s.sessionMessage)
  const clearSessionMessage = useAuthStore((s) => s.clearSessionMessage)

  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(sessionMessage)

  if (token) {
    return <Navigate to="/reports" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    clearSessionMessage()

    if (!usuario.trim() || !senha.trim()) {
      setErro('Por favor, preencha todos os campos.')
      return
    }

    setLoading(true)
    setErro(null)
    try {
      await login(usuario.trim(), senha)
      navigate('/reports', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message)
      } else {
        setErro('Não foi possível entrar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexWrap: 'wrap',
        background: 'var(--surface-page)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <aside
        style={{
          flex: '1 1 440px',
          boxSizing: 'border-box',
          background: 'var(--surface-sidebar)',
          color: 'var(--ink-on-dark)',
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 48,
        }}
      >
        <OmniFlowLogo width={238} height={60} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 460 }}>
          <p style={{ margin: 0, fontSize: 32, lineHeight: '40px', fontWeight: 800 }}>
            Painel estratégico de observabilidade e gestão para squads de desenvolvimento.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 24px',
            paddingTop: 24,
            borderTop: '1px solid var(--border-sidebar)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94A3B8' }}>
            <span
              aria-hidden="true"
              style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--status-positive-dot)' }}
            />
            Softflow API
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94A3B8' }}>
            <span
              aria-hidden="true"
              style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--status-positive-dot)' }}
            />
            Sessão segura
          </span>
        </div>
      </aside>

      <main
        style={{
          flex: '1.1 1 480px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            boxSizing: 'border-box',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 32, lineHeight: '40px', fontWeight: 800 }}>Entrar</h1>
            <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: 'var(--ink-muted)' }}>
              Use seu usuário e senha para acessar o painel.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="usuario" style={{ fontSize: 13, lineHeight: '18px', fontWeight: 700 }}>
                Usuário (e-mail)
              </label>
              <input
                id="usuario"
                name="usuario"
                type="text"
                autoComplete="username"
                inputMode="email"
                placeholder="usuario@exemplo.com"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={loading}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="senha" style={{ fontSize: 13, lineHeight: '18px', fontWeight: 700 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="senha"
                  name="senha"
                  type={senhaVisivel ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={loading}
                  style={{ ...inputStyle, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setSenhaVisivel((v) => !v)}
                  aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: 2,
                    top: 2,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 0,
                    borderRadius: 4,
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--ink-muted)',
                  }}
                >
                  {senhaVisivel ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {erro ? <Alert>{erro}</Alert> : null}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="btn-primary"
              style={{
                width: '100%',
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                border: 0,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary)',
                color: '#FFFFFF',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.85 : 1,
              }}
            >
              {loading ? <Spinner color="#FFFFFF" /> : null}
              <span>{loading ? 'Entrando…' : 'Entrar'}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  height: 44,
  boxSizing: 'border-box',
  padding: '0 12px',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  background: '#FFFFFF',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 14,
}
