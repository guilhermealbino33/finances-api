# Design — Finances

Identidade visual da web (#13). Objetivo: ler dinheiro com pouco ruído, mapa mental próximo à planilha.

## Direção

- **Base:** azul escuro (navy) — fundo e superfícies
- **Acento:** verde neon — CTAs, marca, saldos positivos, foco
- **Não usar:** purple/indigo genérico, cream + terracotta, cards empilhados no mês

## Tokens

| Token | Uso | Valor |
|---|---|---|
| `navy` / `paper` | Fundo da página | `#070d1a` |
| `surface` | Planilha / painéis | `#0f1a2e` |
| `surface-2` | Cabeçalho de bloco | `#15233d` |
| `ink` | Texto principal | `#e7eefc` |
| `muted` | Texto secundário | `#8b9bb8` |
| `line` | Grades / divisórias | `#243552` |
| `accent` | Neon (marca, CTA, positivo) | `#39ff14` |
| `accent-dim` | Neon suave (hover/bg) | `#1a3d24` |
| `danger` | Saldo negativo / erro | `#ff5c7a` |
| `warn` | Obrigações altas | `#ffc14a` |

## Tipografia

- **UI:** [Sora](https://fonts.google.com/specimen/Sora) — sem serifa geométrica, legível
- **Números:** `font-variant-numeric: tabular-nums` + tracking apertado
- **Display (título do mês):** Sora semibold — sem competir com a marca “Finances”

## Semântica de valores

| Tipo | Cor |
|---|---|
| Entrada / saldo ≥ 0 | `accent` |
| Saída / obrigação | `ink` (neutro) ou `warn` se destaque |
| Saldo &lt; 0 | `danger` |
| Linha derivada (Cartões) | `muted` + valor em `ink` |

## Layout do mês (planilha)

Uma **única superfície** (`surface`) com grade:

1. Faixa topo: Caixa editável + totais (A pagar, A receber, Saldo)
2. Blocos empilhados na mesma grade: A pagar → A receber → Cartões → Fixos → Saídas → Outras entradas
3. Cada bloco = cabeçalho + linhas (descrição, vencimento, meta, valor) + linha “nova”
4. Sem cards separados por bloco

## Shell autenticado

- Marca “Finances” em `accent` uppercase tracking
- Nav textual: Início · Contas · Partes · Sair
- Controles de mês compactos na mesma planilha
