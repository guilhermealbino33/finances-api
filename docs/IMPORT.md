# Import Excel — heurísticas (#11)

Endpoint: `POST /api/import/xlsx` (Bearer JWT, multipart campo `file`).

| Query | Default | Efeito |
|---|---|---|
| `commit=false` | sim | **Dry-run / preview** — só parseia; não grava |
| `commit=true` | | Persiste com estratégia **replace** |

Contrato de resposta: `ImportXlsxResponse` em `@finances/shared`.

Arquivo de referência: **Financeiro - 2026.xlsx** (12 abas mensais).

## Idempotência (replace)

Por `(userId, year, month)`:

1. Upsert do `Period` (`caixaBudget` atualizado)
2. **Apaga** todos os `Entry` daquele período
3. Insere os lançamentos parseados

Reimportar o mesmo arquivo não duplica linhas. Alterações manuais no mês são sobrescritas no commit.

## Âncoras de cabeçalho

O parser varre cada aba e muda de bloco ao encontrar cabeçalhos (legado Excel → section do domínio):

| Célula (legado) | Section / efeito |
|---|---|
| `A Pagar` | bloco `PAYABLE` |
| `Nubank` (ou `Cartões` + col. `Parcela`) | bloco `CARD_ITEM` → produto **Cartões** |
| `C6` + col. `Descrição` | `CARD_ITEM` com conta **C6** |
| `Fixos Nubank` / `Fixos…` | `CARD_FIXED` → **Fixos (cartão)** |
| `A receber` | `RECEIVABLE` |
| `Saidas (Dinheiro)` | `CASH_OUT` |
| `Outras Entradas` | `OTHER_INCOME` |
| `Saldo`, `Sugestão IA` | ignorados |

Colunas de **Sugestão IA** (a partir de Maio) nunca viram `Entry` (#16).

## Linhas ignoradas

- Cabeçalhos e linhas `Total`
- **Cartões** dentro de A Pagar (linha derivada = soma cartão + fixos)
- **Custo fixo** dentro do bloco Nubank (espelho do total de Fixos)
- Valores `R$ -`, `0` ou vazios (não geram lançamento)
- Descrições vazias

## Campos mapeados

| Excel | Modelo |
|---|---|
| Nome da aba (Janeiro…) | `Period.month` (1–12) |
| `A1` (serial Excel) | `Period.year` (fallback 2026) |
| Coluna Caixa (`D3`) | `Period.caixaBudget` |
| A–C no bloco A Pagar | `Entry(PAYABLE)` + `dueLabel` |
| Texto `n/m` no vencimento | `installmentCurrent` / `installmentTotal` (+ `dueLabel`) |
| E–G em A receber | `partyName` + descrição + valor → `RECEIVABLE` |
| Itens Nubank/C6 | `CARD_ITEM` + conta Cartões/C6 |
| Fixos | `CARD_FIXED` + conta Cartões |
| Saídas | `CASH_OUT` (conta sugerida na col. F, ex. BB) |
| Outras entradas | `OTHER_INCOME` |

Contas e partes citadas na planilha são **criadas sob demanda** se ainda não existirem.

## Séries (`n/m`)

Parcelas detectáveis gravam progresso no `Entry`. Ligação a `RecurringSeries` / `seriesId` fica para a feature de recorrências (#9) — o import não cria séries enquanto a entidade não estiver em `develop`.

## Conferência (Janeiro referência)

Com a planilha oficial, o preview/commit deve reproduzir (arredondamento ±0.01):

- Caixa `7500`
- `totalPayables` ≈ `8426.40`
- `totalReceivables` ≈ `80`
- `monthBalance` ≈ `-846.40`

Fórmulas: [`DOMAIN.md`](./DOMAIN.md#fórmulas-espelhar-excel).

## Exemplo curl

```bash
# Preview
curl -s -X POST "http://localhost:3002/api/import/xlsx" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@Financeiro - 2026.xlsx" | jq '.totals'

# Commit
curl -s -X POST "http://localhost:3002/api/import/xlsx?commit=true" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@Financeiro - 2026.xlsx" | jq '.mode,.totals'
```
