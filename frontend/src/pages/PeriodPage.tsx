import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type {
  AccountResponse,
  EditableEntrySection,
  EntryResponse,
  PartyResponse,
  PeriodSummaryResponse,
} from '@finances/shared';
import { EntrySectionBlock } from '@/components/entries/EntrySectionBlock';
import { useAuth } from '@/contexts/AuthContext';
import { listAccounts } from '@/lib/accounts-api';
import { listEntries } from '@/lib/entries-api';
import { DASHBOARD_SECTIONS } from '@/lib/entry-labels';
import { formatBrl, parseBrlInput } from '@/lib/money';
import { monthLabel } from '@/lib/months';
import { listParties } from '@/lib/parties-api';
import { ensurePeriod, getPeriodSummary, updatePeriod } from '@/lib/periods-api';
import { paths } from '@/paths';

function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function PeriodPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const fallback = currentYearMonth();
  const year = Number(params.year) || fallback.year;
  const month = Number(params.month) || fallback.month;

  const [summary, setSummary] = useState<PeriodSummaryResponse | null>(null);
  const [entries, setEntries] = useState<EntryResponse[]>([]);
  const [parties, setParties] = useState<PartyResponse[]>([]);
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [caixaInput, setCaixaInput] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const reloadPeriodData = useCallback(async (periodId: number) => {
    const [s, list] = await Promise.all([
      getPeriodSummary(periodId),
      listEntries(periodId),
    ]);
    setSummary(s);
    setEntries(list);
    setCaixaInput(String(s.period.caixaBudget).replace('.', ','));
    setNotes(s.period.notes ?? '');
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [period, partyList, accountList] = await Promise.all([
          ensurePeriod(year, month),
          listParties(),
          listAccounts(),
        ]);
        if (cancelled) return;
        setParties(partyList);
        setAccounts(accountList);
        await reloadPeriodData(period.id);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar período');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year, month, reloadPeriodData]);

  function goTo(nextYear: number, nextMonth: number) {
    navigate(paths.period(nextYear, nextMonth));
  }

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    goTo(d.getFullYear(), d.getMonth() + 1);
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!summary) return;
    const caixa = parseBrlInput(caixaInput);
    if (caixa == null) {
      setError('Informe um valor de Caixa válido');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updatePeriod(summary.period.id, {
        caixaBudget: caixa,
        notes: notes.trim() || null,
      });
      await reloadPeriodData(summary.period.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  }

  function entriesFor(section: EditableEntrySection): EntryResponse[] {
    return entries.filter((e) => e.section === section);
  }

  function sectionTotal(section: EditableEntrySection): number {
    if (!summary) return 0;
    if (section === 'PAYABLE') return summary.totalPayables;
    if (section === 'RECEIVABLE') return summary.totalReceivables;
    if (section === 'CARD_ITEM' || section === 'CARD_FIXED') {
      return entriesFor(section).reduce((acc, e) => acc + e.amount, 0);
    }
    if (section === 'CASH_OUT') return summary.totalCashOut;
    return summary.totalOtherIncome;
  }

  const isEmptyMonth = entries.length === 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-6 py-10 md:max-w-3xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Finances</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            {monthLabel(month)} {year}
          </h1>
          <p className="mt-1 text-sm text-muted">{user?.email}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link to={paths.home} className="text-sm text-muted hover:text-accent">
            Início
          </Link>
          <Link to={paths.accounts} className="text-sm text-muted hover:text-accent">
            Contas
          </Link>
          <Link to={paths.parties} className="text-sm text-muted hover:text-accent">
            Partes
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-muted hover:text-accent"
          >
            Sair
          </button>
        </div>
      </header>

      <nav className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent"
        >
          ← Anterior
        </button>
        <div className="flex gap-2">
          <select
            className="rounded-lg border border-line px-2 py-1.5 text-sm"
            value={month}
            onChange={(e) => goTo(year, Number(e.target.value))}
            aria-label="Mês"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
          <input
            className="w-20 rounded-lg border border-line px-2 py-1.5 text-sm"
            type="number"
            value={year}
            onChange={(e) => goTo(Number(e.target.value) || year, month)}
            aria-label="Ano"
          />
        </div>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent"
        >
          Próximo →
        </button>
      </nav>

      {loading && <p className="text-sm text-muted">Carregando período…</p>}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {summary && !loading && (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <form
              onSubmit={onSave}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Caixa</h2>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Orçamento do mês (R$)
                <input
                  className="rounded-lg border border-line px-3 py-2 font-normal tabular-nums outline-none focus:border-accent"
                  value={caixaInput}
                  onChange={(e) => setCaixaInput(e.target.value)}
                  inputMode="decimal"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Notas
                <textarea
                  className="min-h-[56px] rounded-lg border border-line px-3 py-2 font-normal outline-none focus:border-accent"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={2000}
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Salvando…' : 'Salvar Caixa'}
              </button>
            </form>

            <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Resumo</h2>
              <p className="mt-1 text-xs text-muted">Espelha as fórmulas da planilha.</p>
              <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-1 text-sm tabular-nums">
                <dt className="text-muted">Caixa</dt>
                <dd>{formatBrl(summary.period.caixaBudget)}</dd>
                <dt className="text-muted">A pagar (c/ Cartões)</dt>
                <dd>{formatBrl(summary.totalPayables)}</dd>
                <dt className="text-muted">Cartões (derivado)</dt>
                <dd>{formatBrl(summary.totalCard)}</dd>
                <dt className="text-muted">A receber</dt>
                <dd>{formatBrl(summary.totalReceivables)}</dd>
                <dt className="text-muted">Obrigações líquidas</dt>
                <dd>{formatBrl(summary.netObligations)}</dd>
                <dt className="text-muted">Saídas</dt>
                <dd>{formatBrl(summary.totalCashOut)}</dd>
                <dt className="text-muted">Outras entradas</dt>
                <dd>{formatBrl(summary.totalOtherIncome)}</dd>
                <dt className="font-medium text-ink">Saldo do mês</dt>
                <dd
                  className={
                    summary.monthBalance < 0
                      ? 'font-medium text-red-700'
                      : 'font-medium text-accent'
                  }
                >
                  {formatBrl(summary.monthBalance)}
                </dd>
                <dt className="text-muted">Saldo detalhe</dt>
                <dd>{formatBrl(summary.detailBalance)}</dd>
              </dl>
            </section>
          </section>

          {isEmptyMonth && (
            <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
              Mês novo — adicione itens em A pagar, A receber, Cartões, Fixos, Saídas ou Outras
              entradas abaixo.
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {DASHBOARD_SECTIONS.map((section) => (
              <EntrySectionBlock
                key={section}
                periodId={summary.period.id}
                section={section}
                items={entriesFor(section)}
                parties={parties}
                accounts={accounts}
                sectionTotal={sectionTotal(section)}
                derivedCardTotal={section === 'PAYABLE' ? summary.totalCard : undefined}
                onChanged={() => reloadPeriodData(summary.period.id)}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
