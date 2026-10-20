import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  EDITABLE_ENTRY_SECTIONS,
  type EditableEntrySection,
  type RecurringSeriesResponse,
} from '@finances/shared';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { listAccounts } from '@/lib/accounts-api';
import { SECTION_META } from '@/lib/entry-labels';
import { formatBrl, parseBrlInput } from '@/lib/money';
import {
  createRecurringSeries,
  listRecurringSeries,
  updateRecurringSeries,
} from '@/lib/recurring-api';
import { paths } from '@/paths';

export function RecurringPage() {
  const { logout } = useAuth();
  const [items, setItems] = useState<RecurringSeriesResponse[]>([]);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [name, setName] = useState('');
  const [section, setSection] = useState<EditableEntrySection>('PAYABLE');
  const [amountInput, setAmountInput] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [nextInstallment, setNextInstallment] = useState('1');
  const [dueRule, setDueRule] = useState('dia 07');
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const [series, accs] = await Promise.all([listRecurringSeries(), listAccounts()]);
    setItems(series);
    setAccounts(accs.filter((a) => a.active).map((a) => ({ id: a.id, name: a.name })));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar séries');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const amount = parseBrlInput(amountInput);
    if (!name.trim()) {
      setError('Informe o nome');
      return;
    }
    if (amount == null || amount <= 0) {
      setError('Informe um valor padrão maior que zero');
      return;
    }
    const total = totalInstallments.trim() ? Number(totalInstallments) : null;
    const next = Number(nextInstallment) || 1;

    setSaving(true);
    setError(null);
    try {
      await createRecurringSeries({
        name: name.trim(),
        section,
        defaultAmount: amount,
        totalInstallments: total,
        nextInstallment: next,
        dueRule: dueRule.trim() || null,
        accountId: accountId ? Number(accountId) : null,
      });
      setName('');
      setAmountInput('');
      setTotalInstallments('');
      setNextInstallment('1');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(item: RecurringSeriesResponse, status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED') {
    setError(null);
    try {
      await updateRecurringSeries(item.id, { status });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Finances</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Séries</h1>
          <p className="mt-1 text-sm text-muted">
            Parcelas e recorrentes (consórcio, Vialaser…). Materialize no mês.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm text-muted">
          <Link to={paths.home} className="hover:text-accent">
            Início
          </Link>
          <ThemeToggle />
          <button type="button" onClick={logout} className="hover:text-accent">
            Sair
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={onCreate}
        className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 shadow-sheet"
      >
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Nova série</h2>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nome
          <input
            className="rounded border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Consórcio Imóvel"
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Bloco
            <select
              className="rounded border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
              value={section}
              onChange={(e) => setSection(e.target.value as EditableEntrySection)}
            >
              {EDITABLE_ENTRY_SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {SECTION_META[s].title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Valor padrão (R$)
            <input
              className="rounded border border-line bg-paper px-3 py-2 font-mono outline-none focus:border-accent"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              inputMode="decimal"
              required
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Próxima parcela
            <input
              className="rounded border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
              type="number"
              min={1}
              value={nextInstallment}
              onChange={(e) => setNextInstallment(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Total (vazio = ∞)
            <input
              className="rounded border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
              type="number"
              min={1}
              value={totalInstallments}
              onChange={(e) => setTotalInstallments(e.target.value)}
              placeholder="208"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Vencimento
            <input
              className="rounded border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
              value={dueRule}
              onChange={(e) => setDueRule(e.target.value)}
              placeholder="dia 07"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Conta (opcional)
          <select
            className="rounded border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent disabled:opacity-60"
        >
          {saving ? 'Salvando…' : 'Criar série'}
        </button>
      </form>

      <section className="rounded-xl border border-line bg-surface p-5 shadow-sheet">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Lista</h2>
        {loading && <p className="mt-3 text-sm text-muted">Carregando…</p>}
        {!loading && items.length === 0 && (
          <p className="mt-3 text-sm text-muted">Nenhuma série ainda.</p>
        )}
        <ul className="mt-3 divide-y divide-line">
          {items.map((item) => {
            const progress =
              item.totalInstallments != null
                ? `${item.nextInstallment - 1}/${item.totalInstallments}`
                : `próxima ${item.nextInstallment}`;
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-muted">
                    {SECTION_META[item.section].title} ·{' '}
                    {item.defaultAmount != null ? formatBrl(item.defaultAmount) : 'sem valor'} ·{' '}
                    {progress} · {item.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status !== 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => setStatus(item, 'ACTIVE')}
                      className="rounded border border-line px-2 py-1 text-xs hover:border-accent"
                    >
                      Reativar
                    </button>
                  )}
                  {item.status === 'ACTIVE' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setStatus(item, 'COMPLETED')}
                        className="rounded border border-line px-2 py-1 text-xs hover:border-accent"
                      >
                        Quitar
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(item, 'CANCELLED')}
                        className="rounded border border-line px-2 py-1 text-xs hover:border-danger hover:text-danger"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
