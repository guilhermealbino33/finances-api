# Finances

**Versão:** `0.1.0`

Controle **financeiro pessoal** (web + API) inspirado na planilha mensal *Financeiro*, no padrão de monorepo **Giro Auto / Connect 3D Things**.

Planejamento: [GitHub Project — Finances — MVP](https://github.com/users/guilhermealbino33/projects/9) · [Issues](https://github.com/guilhermealbino33/finances-api/issues).

Fluxo de branches: [`docs/GITFLOW.md`](docs/GITFLOW.md).

## MVP (corte)

| Capacidade | Issue | Status |
|---|---|---|
| Bootstrap monorepo | #1 | entregue |
| GitFlow + Kanban | #2 | entregue |
| Modelo de domínio (planilha) | #3 | entregue · [`docs/DOMAIN.md`](docs/DOMAIN.md) |
| Auth JWT | #4 | entregue |
| Períodos + Caixa | #5 | entregue |
| Contas e partes | #6 | em progresso |
| Lançamentos / cartão / parcelas | #7–#9 | TODO |
| Dashboard do mês + import Excel + resumo anual | #10–#12 | TODO |

Fora do corte inicial: multi-usuário (#14), mobile (#15), sugestões IA (#16).

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS · TypeORM · PostgreSQL |
| Web | React · Vite · Tailwind CSS |
| Contratos | `@finances/shared` (TypeScript) |

## Arquitetura

Monorepo **npm workspaces** com monólito modular NestJS:

- `crosscutting/` — config tipada, database (entities/migrations index), ValidationPipe
- `modules/<feature>/` — controllers, services, dto, entities
- TypeORM com `synchronize: false` + migrations explícitas
- Pacote `packages/shared` como contrato de tipos

Detalhes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · domínio da planilha: [`docs/DOMAIN.md`](docs/DOMAIN.md).

### Estrutura alvo

```
finances-api/
├── package.json
├── docker-compose.yml           # Postgres :5446
├── backend/                     # NestJS — :3002/api
├── frontend/                    # Vite + React — :8081
└── packages/shared/             # @finances/shared
```

## Setup rápido

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d
npm install
npm run backend:dev      # http://localhost:3002/api/health
npm run frontend:dev     # http://localhost:8081
# ou ambos: npm run dev
```

| Serviço | URL / porta |
|---|---|
| API health | http://localhost:3002/api/health |
| Web | http://localhost:8081 |
| Postgres | `localhost:5446` (user/pass/db: `finances`) |

### Seed local (auth + contas/partes)

No boot da API, se ainda não existirem (idempotente):

| | |
|---|---|
| E-mail | `guilhermealbino33@gmail.com` |
| Senha | `finances123` |
| Contas | Cartões (`CARD`), C6 (`CARD`), Dinheiro (`CASH`), BB (`BANK`) |
| Partes | Gui, Udo, Vivi, Danilo |

Sobrescreva com `SEED_USER_*` / `JWT_SECRET` em `backend/.env` (ver `.env.example`).

Telas: `/contas` e `/partes` (API `GET/POST/PATCH /api/accounts` e `/api/parties`).

## Fluxo de trabalho

GitFlow simplificado — detalhes em [`docs/GITFLOW.md`](docs/GITFLOW.md):

1. Pegar issue no [Project](https://github.com/users/guilhermealbino33/projects/9) → **In Progress**
2. Branch a partir de `develop`: `<tipo>/#N/slug-kebab`
3. PR com base **`develop`** e `Closes #N`
4. Merge só após review; depois branch removida e item → **Done**
