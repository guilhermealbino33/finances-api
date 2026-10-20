# Gitflow — Finances

Fluxo de branches baseado em **gitflow** simplificado + convenção obrigatória de nomes (mesmo padrão Giro Auto / Connect 3D Things).

## Branches de longa duração

| Branch | Papel |
|---|---|
| `main` | Produção / releases estáveis |
| `develop` | Integração contínua do MVP |

## Branches de trabalho

Toda branch de trabalho **deve** seguir o modelo:

```text
<tipo>/#<numero-da-issue>/<nome-da-branch>
```

### Tipos permitidos

| Prefixo | Quando usar |
|---|---|
| `feature` | Nova capacidade ou melhoria de produto |
| `bugfix` | Correção de defeito |
| `chore` | Manutenção, tooling, docs sem mudança de produto |
| `hotfix` | Correção urgente a partir de `main` |
| `release` | Preparação de release (`develop` → `main`) |
| `refactor` | Refatoração sem feature nova |
| `docs` | Somente documentação (alternativa a `chore`) |

### Regras do nome

1. **Sempre** incluir o número da issue GitHub após `/#`.
2. `nome-da-branch` em **kebab-case**, curto e descritivo (3–5 palavras).
3. Sem espaços, sem acentos, sem underscores no slug.
4. Uma issue principal por branch (evite misturar escopos).

### Exemplos

```text
feature/#5/periodos-mensais-caixa
bugfix/#10/saldo-formula-ptbr
chore/#2/gitflow-docs
hotfix/#12/import-xlsx-crash
release/#0/mvp-0.1.0
```

### Exemplos inválidos

```text
feature/periodos             # falta #<issue>
feature/5-periodos           # falta o '#'
Feature/#5/Periodos_Caixa    # case/underscore incorretos
fix-saldo                  # sem tipo e sem issue
```

## Fluxo padrão

```bash
# 1. Atualizar develop
git checkout develop
git pull origin develop

# 2. Criar branch a partir de develop
git checkout -b feature/#5/periodos-mensais-caixa

# 3. Commits → push → PR para develop
git push -u origin HEAD
gh pr create --base develop --title "…" --body "Closes #5"

# 4. Após merge em develop, remover a feature branch se não for mais necessária
```

### Hotfix

```bash
git checkout main
git pull origin main
git checkout -b hotfix/#12/import-xlsx-crash
# PR → main (e cherry-pick/merge de volta em develop)
```

### Release

```bash
git checkout develop
git pull origin develop
git checkout -b release/#0/mvp-0.1.0
# 1. Alinhar version em todos os package.json (SemVer)
# 2. Atualizar README (e docs/VERSIONING.md quando existir)
# 3. PR → main → tag vX.Y.Z → GitHub Release
# 4. Merge main de volta em develop
```

## Pull requests

- Feature / bugfix / chore / refactor / docs → base **`develop`**
- Hotfix / release → base **`main`** (e sincronizar `develop` depois)
- No corpo do PR: referenciar a issue (`Closes #N` ou `Fixes #N`)
- PR fica aberto para review — merge só com OK explícito

## Relação com o Kanban

O número da branch é o da issue no Project [Finances — MVP](https://github.com/users/guilhermealbino33/projects/9).

Antes de abrir a branch:

1. Assinar a issue (`gh issue edit N --add-assignee @me`)
2. Mover o item do Project para **In Progress**
3. Comentar na issue: branch em uso

Após merge em `develop`: fechar a issue (se `Closes #N` não fechar), mover para **Done**, apagar a branch remota/local.
