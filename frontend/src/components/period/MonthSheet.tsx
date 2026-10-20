import { useState, type FormEvent } from 'react';
import type {
  AccountResponse,
  EditableEntrySection,
  EntryResponse,
  PartyResponse,
  PeriodSummaryResponse,
} from '@finances/shared';
import { createEntry, deleteEntry } from '@/lib/entries-api';
import { SECTION_META } from '@/lib/entry-labels';
import { formatBrl, parseBrlInput } from '@/lib/money';

const SHEET_SECTIONS: EditableEntrySection[] = [
  'PAYABLE',
  'RECEIVABLE',
  'CARD_ITEM',
  'CARD_FIXED',
  'CASH_OUT',
  'OTHER_INCOME',
];

type Draft = {
  description: string;
  dueLabel: string;
  amount: string;
  partyId: string;
  accountId: string;
  installmentCurrent: string;
  installmentTotal: string;
};

const emptyDraft = (): Draft => ({
  description: '',
  dueLabel: '',
  amount: '',
  partyId: '',
  accountId: '',
  installmentCurrent: '',
  installmentTotal: '',
});

type Props = {
  periodId: number;
  summary: PeriodSummaryResponse;
  entries: EntryResponse[];
  parties: PartyResponse[];
  accounts: AccountResponse[];
  caixaInput: string;
  notes: string;
  savingCaixa: boolean;
  onCaixaChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSaveCaixa: (event: FormEvent) => void;
  onChanged: () => Promise<void>;
};

export function MonthSheet({
  periodId,
  summary,
  entries,
  parties,
  accounts,
  caixaInput,
  notes,
  savingCaixa,
  onCaixaChange,
  onNotesChange,
  onSaveCaixa,
  onChanged,
}: Props) {
  const [drafts, setDrafts] = useState<Record<EditableEntrySection, Draft>>(() =>
    Object.fromEntries(SHEET_SECTIONS.map((s) => [s, emptyDraft()])) as Record<
      EditableEntrySection,
      Draft
    >,
  );
  const [rowError, setRowError] = useState<string | null>(null);
  const [busySection, setBusySection] = useState<EditableEntrySection | null>(null);

  function entriesFor(section: EditableEntrySection): EntryResponse[] {
    return entries.filter((e) => e.section === section);
  }

  function sectionSum(section: EditableEntrySection): number {
    if (section === 'PAYABLE') return summary.totalPayables;
    if (section === 'RECEIVABLE') return summary.totalReceivables;
    if (section === 'CASH_OUT') return summary.totalCashOut;
    if (section === 'OTHER_INCOME') return summary.totalOtherIncome;
    return entriesFor(section).reduce((acc, e) => acc + e.amount, 0);
  }

  function updateDraft(section: EditableEntrySection, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
  }

  async function onAdd(section: EditableEntrySection, event: FormEvent) {
    event.preventDefault();
    const draft = drafts[section];
    const amount = parseBrlInput(draft.amount);
    if (amount == null || amount <= 0) {
      setRowError('Informe um valor maior que zero');
      return;
    }
    if (!draft.description.trim()) {
      setRowError('Informe a descrição');
      return;
    }
    const cur = draft.installmentCurrent.trim() ? Number(draft.installmentCurrent) : null;
    const tot = draft.installmentTotal.trim() ? Number(draft.installmentTotal) : null;
    if ((cur == null) !== (tot == null)) {
      setRowError('Informe parcela atual e total juntos, ou deixe vazios');
      return;
    }

    setBusySection(section);
    setRowError(null);
    try {
      await createEntry({
        periodId,
        section,
        description: draft.description.trim(),
        amount,
        dueLabel: draft.dueLabel.trim() || null,
        partyId: section === 'RECEIVABLE' && draft.partyId ? Number(draft.partyId) : null,
        accountId:
          (section === 'CARD_ITEM' || section === 'CARD_FIXED') && draft.accountId
            ? Number(draft.accountId)
            : null,
        installmentCurrent: cur,
        installmentTotal: tot,
      });
      setDrafts((prev) => ({ ...prev, [section]: emptyDraft() }));
      await onChanged();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Falha ao adicionar');
    } finally {
      setBusySection(null);
    }
  }

  async function onDelete(id: number) {
    setRowError(null);
    try {
      await deleteEntry(id);
      await onChanged();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Falha ao excluir');
    }
  }

  const cardAccounts = accounts.filter((a) => a.active && a.type === 'CARD');
  const balanceClass =
    summary.monthBalance < 0 ? 'text-danger' : 'text-accent';

  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-sheet">
      {/* Faixa topo — Caixa + totais */}
      <form
        onSubmit={onSaveCaixa}
        className="grid gap-3 border-b border-line bg-surface-2 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-muted">
            Caixa
            <input
              className="sheet-input rounded border border-line font-mono tabular-nums"
              value={caixaInput}
              onChange={(e) => onCaixaChange(e.target.value)}
              inputMode="decimal"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-muted sm:col-span-2">
            Notas
            <input
              className="sheet-input rounded border border-line"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              maxLength={2000}
              placeholder="opcional"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={savingCaixa}
          className="rounded bg-accent px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {savingCaixa ? '…' : 'Salvar Caixa'}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
        <TotalCell label="A pagar" value={summary.totalPayables} />
        <TotalCell label="A receber" value={summary.totalReceivables} />
        <TotalCell label="Obrigações líq." value={summary.netObligations} />
        <TotalCell label="Saldo do mês" value={summary.monthBalance} emphasize className={balanceClass} />
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
        <TotalCell label="Cartões" value={summary.totalCard} muted />
        <TotalCell label="Saídas" value={summary.totalCashOut} muted />
        <TotalCell label="Outras entradas" value={summary.totalOtherIncome} muted />
        <TotalCell label="Saldo detalhe" value={summary.detailBalance} muted />
      </div>

      {rowError && (
        <p className="border-b border-line bg-danger/10 px-4 py-2 text-sm text-danger" role="alert">
          {rowError}
        </p>
      )}

      {SHEET_SECTIONS.map((section) => {
        const meta = SECTION_META[section];
        const items = entriesFor(section);
        const isCard = section === 'CARD_ITEM' || section === 'CARD_FIXED';
        const draft = drafts[section];

        return (
          <section key={section} className="border-b border-line last:border-b-0">
            <div className="flex items-baseline justify-between gap-3 bg-surface-2 px-4 py-2">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  {meta.title}
                </h2>
                <p className="text-[11px] text-muted">{meta.hint}</p>
              </div>
              <p className="font-mono text-sm tabular-nums text-ink">{formatBrl(sectionSum(section))}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-3 py-1.5 font-medium">Descrição</th>
                    <th className="w-28 px-2 py-1.5 font-medium">Venc.</th>
                    <th className="w-36 px-2 py-1.5 font-medium">
                      {section === 'RECEIVABLE' ? 'Parte' : isCard ? 'Parc. / Conta' : '—'}
                    </th>
                    <th className="w-28 px-2 py-1.5 text-right font-medium">Valor</th>
                    <th className="w-16 px-2 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const partyName =
                      item.partyId != null
                        ? parties.find((p) => p.id === item.partyId)?.name
                        : null;
                    const accountName =
                      item.accountId != null
                        ? accounts.find((a) => a.id === item.accountId)?.name
                        : null;
                    const parcel =
                      item.installmentCurrent != null && item.installmentTotal != null
                        ? `${item.installmentCurrent}/${item.installmentTotal}`
                        : null;
                    const metaCell =
                      section === 'RECEIVABLE'
                        ? (partyName ?? '—')
                        : isCard
                          ? [parcel, accountName].filter(Boolean).join(' · ') || '—'
                          : '—';

                    return (
                      <tr key={item.id} className="border-b border-line/70 hover:bg-accent-dim/20">
                        <td className="px-3 py-1.5 text-ink">{item.description}</td>
                        <td className="px-2 py-1.5 text-muted">{item.dueLabel ?? '—'}</td>
                        <td className="px-2 py-1.5 text-muted">{metaCell}</td>
                        <td className="px-2 py-1.5 text-right font-mono tabular-nums text-ink">
                          {formatBrl(item.amount)}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            className="text-xs text-muted hover:text-danger"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {section === 'PAYABLE' && (
                    <tr className="border-b border-line/70 bg-surface-2/50">
                      <td className="px-3 py-1.5 text-muted">Cartões</td>
                      <td className="px-2 py-1.5 text-muted">derivado</td>
                      <td className="px-2 py-1.5 text-muted">itens + fixos</td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-ink">
                        {formatBrl(summary.totalCard)}
                      </td>
                      <td />
                    </tr>
                  )}

                  {items.length === 0 && section !== 'PAYABLE' && (
                    <tr className="border-b border-line/70">
                      <td colSpan={5} className="px-3 py-2 text-xs text-muted">
                        Sem linhas — use a linha abaixo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto border-t border-line bg-paper/40">
              <form
                onSubmit={(e) => onAdd(section, e)}
                className="grid min-w-[640px] grid-cols-[1fr_7rem_9rem_7rem_auto] gap-0"
              >
                <input
                  className="sheet-input border-r border-line"
                  placeholder="Nova descrição…"
                  value={draft.description}
                  onChange={(e) => updateDraft(section, { description: e.target.value })}
                  maxLength={255}
                />
                <input
                  className="sheet-input border-r border-line"
                  placeholder="dia 07"
                  value={draft.dueLabel}
                  onChange={(e) => updateDraft(section, { dueLabel: e.target.value })}
                  maxLength={80}
                />
                {section === 'RECEIVABLE' ? (
                  <select
                    className="sheet-input border-r border-line"
                    value={draft.partyId}
                    onChange={(e) => updateDraft(section, { partyId: e.target.value })}
                  >
                    <option value="">Parte</option>
                    {parties
                      .filter((p) => p.active)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                ) : isCard ? (
                  <div className="flex border-r border-line">
                    <input
                      className="sheet-input w-12 border-r border-line"
                      placeholder="n"
                      value={draft.installmentCurrent}
                      onChange={(e) => updateDraft(section, { installmentCurrent: e.target.value })}
                      inputMode="numeric"
                      title="Parcela atual"
                    />
                    <input
                      className="sheet-input w-12 border-r border-line"
                      placeholder="m"
                      value={draft.installmentTotal}
                      onChange={(e) => updateDraft(section, { installmentTotal: e.target.value })}
                      inputMode="numeric"
                      title="Total parcelas"
                    />
                    <select
                      className="sheet-input min-w-0 flex-1"
                      value={draft.accountId}
                      onChange={(e) => updateDraft(section, { accountId: e.target.value })}
                    >
                      <option value="">Cartões</option>
                      {cardAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="border-r border-line px-2 py-1.5 text-muted">—</span>
                )}
                <input
                  className="sheet-input border-r border-line text-right font-mono tabular-nums"
                  placeholder="0,00"
                  value={draft.amount}
                  onChange={(e) => updateDraft(section, { amount: e.target.value })}
                  inputMode="decimal"
                />
                <button
                  type="submit"
                  disabled={busySection === section}
                  className="px-3 text-sm font-semibold text-accent hover:bg-accent-dim disabled:opacity-50"
                >
                  +
                </button>
              </form>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TotalCell({
  label,
  value,
  emphasize,
  muted,
  className = '',
}: {
  label: string;
  value: number;
  emphasize?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={[
          'mt-0.5 font-mono text-sm tabular-nums',
          emphasize ? 'font-semibold' : '',
          muted ? 'text-muted' : 'text-ink',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {formatBrl(value)}
      </p>
    </div>
  );
}
