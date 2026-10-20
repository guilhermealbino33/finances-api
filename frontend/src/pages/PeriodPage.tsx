import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type {
  AccountResponse,
  EntryResponse,
  PartyResponse,
  PeriodSummaryResponse,
} from '@finances/shared';
import { MonthSheet } from '@/components/period/MonthSheet';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { listAccounts } from '@/lib/accounts-api';
import { listEntries } from '@/lib/entries-api';
import { parseBrlInput } from '@/lib/money';
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

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-3 py-6 sm:px-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Finances</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {monthLabel(month)} {year}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded border border-line px-2.5 py-1 text-sm text-ink hover:border-accent"
            aria-label="Mês anterior"
          >
            ←
          </button>
          <select
            className="rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
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
            className="w-16 rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
            type="number"
            value={year}
            onChange={(e) => goTo(Number(e.target.value) || year, month)}
            aria-label="Ano"
          />
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded border border-line px-2.5 py-1 text-sm text-ink hover:border-accent"
            aria-label="Próximo mês"
          >
            →
          </button>
          <nav className="ml-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <Link to={paths.home} className="hover:text-accent">
              Início
            </Link>
            <Link to={paths.accounts} className="hover:text-accent">
              Contas
            </Link>
            <Link to={paths.parties} className="hover:text-accent">
              Partes
            </Link>
            <ThemeToggle />
            <button type="button" onClick={logout} className="hover:text-accent" title={user?.email}>
              Sair
            </button>
          </nav>
        </div>
      </header>

      {loading && <p className="text-sm text-muted">Carregando planilha do mês…</p>}
      {error && (
        <p className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {summary && !loading && (
        <MonthSheet
          periodId={summary.period.id}
          summary={summary}
          entries={entries}
          parties={parties}
          accounts={accounts}
          caixaInput={caixaInput}
          notes={notes}
          savingCaixa={saving}
          onCaixaChange={setCaixaInput}
          onNotesChange={setNotes}
          onSaveCaixa={onSave}
          onChanged={() => reloadPeriodData(summary.period.id)}
        />
      )}
    </main>
  );
}
