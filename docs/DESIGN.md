# Design — Finances

Identidade visual da web (#13, #35). Objetivo: ler dinheiro com pouco ruído, mapa mental próximo à planilha.

## Temas

| Tema | Papel | Destaque |
|---|---|---|
| **light** | **Default** (primeira visita) | Verde floresta sobre fundo frio claro |
| **dark** | Alternativa (navy + neon) | Verde neon `#39ff14` sobre navy |

- Preferência em `localStorage` (`finances.theme` = `light` \| `dark`)
- Toggle no shell (login e páginas autenticadas)
- **Não** segue `prefers-color-scheme` no MVP — default explícito é light

## Direção

- Mesma estrutura de layout nos dois temas (planilha única, sem cards empilhados no mês)
- **Não usar:** purple/indigo genérico, cream + terracotta

## Tokens — light (default)

| Token | Uso | Valor |
|---|---|---|
| `paper` | Fundo da página | `#eef2f7` |
| `surface` | Planilha / painéis | `#ffffff` |
| `surface-2` | Cabeçalho de bloco | `#e8eef6` |
| `ink` | Texto principal | `#0f1a2e` |
| `muted` | Texto secundário | `#5a6b82` |
| `line` | Grades / divisórias | `#cfd8e6` |
| `accent` | Marca, CTA, saldo ≥ 0 | `#0b8f3e` |
| `accent-dim` | Hover / foco suave | `#d4f0e0` |
| `on-accent` | Texto sobre CTA | `#ffffff` |
| `danger` | Saldo negativo / erro | `#d93657` |
| `warn` | Obrigações altas | `#b8860b` |

## Tokens — dark

| Token | Uso | Valor |
|---|---|---|
| `paper` | Fundo | `#070d1a` |
| `surface` | Planilha / painéis | `#0f1a2e` |
| `surface-2` | Cabeçalho de bloco | `#15233d` |
| `ink` | Texto principal | `#e7eefc` |
| `muted` | Texto secundário | `#8b9bb8` |
| `line` | Grades | `#243552` |
| `accent` | Neon | `#39ff14` |
| `accent-dim` | Neon suave | `#1a3d24` |
| `on-accent` | Texto sobre CTA | `#070d1a` |
| `danger` | Erro / saldo &lt; 0 | `#ff5c7a` |
| `warn` | Destaque | `#ffc14a` |

Implementação: CSS variables em `data-theme` + Tailwind (`var(--color-*)`).

## Tipografia

- **UI:** [Sora](https://fonts.google.com/specimen/Sora)
- **Números:** tabular-nums (IBM Plex Mono onde couber)
- Título do mês: Sora semibold — sem competir com a marca “Finances”

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
2. Blocos empilhados: A pagar → A receber → Cartões → Fixos → Saídas → Outras entradas
3. Cada bloco = cabeçalho + linhas + linha “nova”
4. Sem cards separados por bloco

## Shell autenticado

- Marca “Finances” em `accent` uppercase tracking
- Nav: Início · Contas · Partes · tema (Claro/Escuro) · Sair
- Controles de mês compactos na mesma planilha
