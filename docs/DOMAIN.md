# Domínio — Finances

Modelo normalizado a partir da planilha **Financeiro - 2026.xlsx** (12 abas mensais). Objetivo: preservar o mapa mental do Excel e permitir CRUD + seed/import sem planilha como fonte de verdade.

Escopo MVP: **uso pessoal / single-user** com `userId` em todas as entidades de domínio. Multi-tenant (`organizationId`) e mobile ficam no backlog (#14, #15).

## Visão da planilha

Cada aba (Janeiro…Dezembro) é um **período mensal** com blocos lado a lado:

| Bloco na planilha (Excel) | Nome no produto | Papel |
|---|---|---|
| **A Pagar** | A pagar | Obrigações do mês (consórcio, DAS, seguro, linha **Cartões**, etc.) |
| **Caixa** | Caixa | Orçamento / renda base do mês (ex.: 7500 → 8000) |
| **A receber** | A receber | Entradas de terceiros / rateios (pessoa + descrição + valor) |
| **Nubank** *(rótulo legado no Excel)* | **Cartões** | Itens da fatura (`Geral`, compras, parcelas `n/m`) |
| **Fixos Nubank** *(legado)* | **Fixos (cartão)** | Assinaturas/recorrências no cartão (Prudential, Prime, Cursor…) |
| **Saídas (Dinheiro)** | Saídas (dinheiro) | Débitos em conta / caixa (não cartão) |
| **Outras Entradas** | Outras entradas | Benefício, freelance, rendimentos, etc. |
| **Saldo** | Saldo | Resultado do mês (célula derivada) |

No app e na API usamos **Cartões** / **Fixos (cartão)** — não “Nubank”. O import (#11) mapeia os cabeçalhos legados do Excel para esses nomes.

A linha **Cartões** em A Pagar **não é um lançamento editável avulso**: é a soma de itens de cartão + fixos do cartão.

Coluna **Sugestão IA** (apareceu em Maio) → fora do MVP (#16).

## Entidades

### User (prep. #4)

Autenticação JWT. Toda entidade de domínio carrega `userId` (FK). Queries sempre filtradas pelo usuário do token.

### Period

Representa uma aba/mês.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | PK | |
| `userId` | FK | |
| `year` | int | ex.: 2026 |
| `month` | int | 1–12 |
| `caixaBudget` | decimal(12,2) | coluna Caixa |
| `notes` | text? | |
| `createdAt` / `updatedAt` | timestamp | `BaseEntity` |

UK: `(userId, year, month)`.

### Account

Conta financeira para classificar lançamentos.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | PK | |
| `userId` | FK | |
| `name` | string | **Cartões**, C6, BB, Dinheiro… |
| `type` | varchar | `CARD` \| `CASH` \| `BANK` \| `OTHER` |
| `active` | boolean | default true |

Seed padrão: **Cartões** (`CARD`), C6 (`CARD`, se usado), Dinheiro/BB (`CASH`/`BANK`).

### Party

Pessoa envolvida em **A receber** (e eventualmente pagamentos compartilhados).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | PK | |
| `userId` | FK | |
| `name` | string | Gui, Udo, Vivi, Danilo… |
| `active` | boolean | |

### RecurringSeries

Série parcelada ou obrigação recorrente que materializa `Entry` mês a mês.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | PK | |
| `userId` | FK | |
| `name` | string | Consórcio Imóvel, Vialaser… |
| `section` | varchar | section alvo do `Entry` gerado |
| `accountId` | FK? | tipicamente conta **Cartões** |
| `defaultAmount` | decimal(12,2)? | pode variar (override no Entry) |
| `totalInstallments` | int? | null = recorrente sem fim conhecido |
| `nextInstallment` | int | próximo `current` a materializar |
| `dueRule` | string? | `dia 07`, `Recorrente`, livre |
| `status` | varchar | `ACTIVE` \| `COMPLETED` \| `CANCELLED` |

### Entry

Lançamento do período. Tipado por `section` (espelha os blocos).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | PK | |
| `userId` | FK | |
| `periodId` | FK | |
| `section` | varchar | ver enum abaixo |
| `description` | string | |
| `amount` | decimal(12,2) | > 0 |
| `dueLabel` | string? | texto livre: `dia 07`, `59/80`, `Recorrente`, `Quitação` |
| `installmentCurrent` | int? | |
| `installmentTotal` | int? | |
| `accountId` | FK? | |
| `partyId` | FK? | típico em `RECEIVABLE` |
| `seriesId` | FK? | se veio de `RecurringSeries` |
| `notes` | text? | |
| `sortOrder` | int? | opcional, UI |

#### Sections

| `section` | Bloco (produto) | Direção |
|---|---|---|
| `PAYABLE` | A pagar (exceto linha Cartões) | saída |
| `RECEIVABLE` | A receber | entrada |
| `CARD_ITEM` | Cartões — itens da fatura | saída (via cartão) |
| `CARD_FIXED` | Fixos (cartão) | saída (via cartão) |
| `CASH_OUT` | Saídas (dinheiro) | saída |
| `OTHER_INCOME` | Outras entradas | entrada |

Valores persistidos como **`varchar`** (sem ENUM PostgreSQL), tipados em `@finances/shared`.

## Relacionamentos

```mermaid
erDiagram
  User ||--o{ Period : owns
  User ||--o{ Account : owns
  User ||--o{ Party : owns
  User ||--o{ RecurringSeries : owns
  User ||--o{ Entry : owns
  Period ||--o{ Entry : contains
  Account ||--o{ Entry : classifies
  Party ||--o{ Entry : party
  RecurringSeries ||--o{ Entry : materializes
```

## Mapeamento planilha → modelo

| Célula / padrão Excel | Modelo |
|---|---|
| Aba “Outubro” + A1 data | `Period(year=2026, month=10)` |
| Caixa `D3=8000` | `Period.caixaBudget` |
| A Pagar: Flow / DAS / Consórcio… | `Entry(section=PAYABLE)` |
| A Pagar: linha **Cartões** + valor | **Derivado** — não persistir como Entry |
| A receber: Gui / Spotify / 40 | `Entry(section=RECEIVABLE, party=Gui)` |
| Bloco “Nubank” no Excel → **Cartões** | `Entry(section=CARD_ITEM)` (+ parcelas) |
| Bloco “Fixos Nubank” → **Fixos (cartão)** | `Entry(section=CARD_FIXED)` |
| Saídas (Dinheiro) | `Entry(section=CASH_OUT)` |
| Outras Entradas: Benefício | `Entry(section=OTHER_INCOME)` |
| Parcela `20/208` recorrente | `RecurringSeries` + `Entry.seriesId` |
| Totais / Saldo | Calculados na API |

Linhas de cabeçalho (`A Pagar`, `Vencimento`, `Total`) e células de layout são **ignoradas** no import/seed.

## Fórmulas (espelhar Excel)

Observado na planilha (ex. Janeiro):

- `totalCard = sum(CARD_ITEM) + sum(CARD_FIXED)`
- `totalPayables = sum(PAYABLE) + totalCard`
- `totalReceivables = sum(RECEIVABLE)`
- `netObligations = totalPayables - totalReceivables`
- `monthBalance = caixaBudget - totalPayables + totalReceivables`

Conferência Janeiro: Caixa 7500, A pagar 8426.40, A receber 80 → saldo `-846.40`.

**Fora do total a pagar / saldo do topo** (mas visíveis no dashboard):

- `sum(CASH_OUT)` — saídas em dinheiro
- `sum(OTHER_INCOME)` — outras entradas

Esses blocos alimentam o **Saldo** inferior da planilha; no MVP a API pode expor:

```text
detailBalance = monthBalance - sum(CASH_OUT) + sum(OTHER_INCOME)
```

(ajustar na implementação do dashboard #10 se algum mês divergir — documentar no PR da feature).

Totais **não** são persistidos (exceto cache futuro opcional). Sempre derivados.

## Seed local (dados da planilha)

Em vez de depender do Excel no dia a dia, o ambiente local usa um **seeder** idempotente ligado ao usuário pessoal.

| Item | Valor |
|---|---|
| E-mail | `guilhermealbino33@gmail.com` |
| Senha (dev) | documentar em README no PR de auth (#4) — ex.: `finances123` |
| Conta padrão cartão | **Cartões** (`type=CARD`) |
| Fonte dos lançamentos | Conteúdo da planilha *Financeiro - 2026* (12 meses) |

### O que o seed cria

1. **User** Guilherme (acima)
2. **Accounts** — Cartões, C6 (se aparecer nos dados), Dinheiro/BB
3. **Parties** — Gui, Udo, Vivi, Danilo, etc. (extraídas da planilha)
4. **Periods** 2026-01…12 com `caixaBudget`
5. **Entries** + **RecurringSeries** conforme os blocos (Cartões / fixos / a pagar / a receber / saídas / outras entradas)

### Como entregar na engenharia

- Seed TypeORM / script `npm run seed` (dev only), **não** rodar em produção sem flag explícita
- Dados versionados como JSON/TS gerados a partir do xlsx (ou reutilizar o parser do import #11)
- Idempotente: reexecutar não duplica períodos do mesmo `userId`
- Import xlsx (#11) continua útil para reimportar/atualizar; o seed é o caminho feliz do localhost

Implementação do seed: começa no #4 (user + contas mínimas) e completa quando #7/#8 existirem (lançamentos 2026).

## Contratos HTTP sugeridos (rascunho)

Prefixo: `/api`. Rotas de domínio exigem Bearer (#4). `GET /api/health` permanece público.

### Auth (#4)
- `POST /api/auth/login` → `{ access_token, user }`
- `GET /api/auth/me`

### Periods (#5)
- `GET /api/periods?year=`
- `GET /api/periods/:year/:month`
- `POST /api/periods`
- `PATCH /api/periods/:id`
- `GET /api/periods/:id/summary` — totais do mês

### Accounts & Parties (#6)
- CRUD `/api/accounts`
- CRUD `/api/parties`

### Entries (#7–#8)
- `GET /api/periods/:id/entries?section=`
- `POST /api/entries`
- `PATCH /api/entries/:id`
- `DELETE /api/entries/:id`

### Recurring (#9)
- CRUD `/api/recurring-series`
- `POST /api/periods/:id/materialize-series` — gera Entries do mês

### Import (#11)
- `POST /api/import/xlsx` — dry-run + commit (cabeçalhos legados “Nubank” → Cartões)
- Heurísticas: [`IMPORT.md`](./IMPORT.md)

### Annual (#12)
- `GET /api/periods/summary?year=2026`

## Decisões explícitas

| Tema | Decisão |
|---|---|
| Nome do bloco de fatura | **Cartões** (não “Nubank” no produto) |
| Dados iniciais locais | **Seeder** com usuário Guilherme + planilha 2026 |
| Mobile | Fora do MVP (#15) |
| Multi-user / família | Backlog via `organizationId` (#14); MVP só `userId` |
| Linha Cartões (A pagar) | Sempre **derivada** |
| Moeda | BRL; `decimal` na API; formatação pt-BR na UI |
| Status / sections | `varchar` + tipos em `@finances/shared` |
| Sugestões IA | Backlog (#16) |
| Import Excel | Heurísticas em `docs/IMPORT.md` na issue #11 |

## Ordem de implementação sugerida

1. #4 Auth + `userId` + seed do usuário / contas Cartões
2. #5 Period + summary stub
3. #6 Account / Party (+ seed de parties)
4. #7 Entries (PAYABLE, RECEIVABLE, CASH_OUT, OTHER_INCOME)
5. #8 CARD_ITEM / CARD_FIXED + Cartões derivado (+ seed dos meses 2026)
6. #9 RecurringSeries
7. #10 Dashboard
8. #11 Import xlsx (legado Excel → Cartões)
9. #12 Resumo anual
