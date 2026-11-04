# OmniFlow

Painel estratégico de observabilidade e gestão para squads Softflow.

## Escopo do MVP

Implementado conforme o pacote de handoff (`OmniFlow-utils/handoff-omniFlow`), na ordem E0 → E4:

| Épico | Status |
| --- | --- |
| E0 Base — cliente HTTP, guarda de rotas, estado global, tokens | Feito |
| E1 Login — `POST /auth/login`, sessão, logout/401 | Feito |
| E2 Contexto — squad, projetos, projeto atual, status, usuários | Feito |
| E3 Reports — `GET /projeto-memoria`, filtros, tiles, paginação, edição | Feito |
| E4 Distribuição — capacidade ±15%, drag-and-drop, `PUT` | Feito |
| E5 Radar Fiscal / E6 Conciliação | Stub (fase futura) |

API Softflow: `http://177.43.232.2:25083/api-soft-flow/api`  
No dev, o Vite faz proxy de `/api-soft-flow` para evitar CORS.

## Stack

- React 19 + TypeScript + Vite
- React Router
- Zustand (auth + contexto da squad)
- Design tokens do handoff (`Plus Jakarta Sans` / `JetBrains Mono`)

## Como rodar

```bash
npm install
npm run dev
```

Abra a URL do Vite (geralmente `http://localhost:5173`). Qualquer tela sem token redireciona para `/login`.

## Scripts

- `npm run dev` — desenvolvimento com proxy Softflow
- `npm run build` — build de produção
- `npm run preview` — preview do build
- `npm run lint` — oxlint

## Variáveis

Veja `.env.example`:

- `VITE_SOFTFLOW_BASE_URL` — base da API (default `/api-soft-flow/api`)
- `VITE_TESTE_PENDENTE_DIAS` — limite do tile “Teste pendente” (default 15)
- `VITE_CAPACIDADE_HORAS` — capacidade alvo por DEV (default 60)
