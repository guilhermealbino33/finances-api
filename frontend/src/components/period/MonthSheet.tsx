import { useState, type FormEvent, type ReactNode } from 'react';
import type {
  AccountResponse,
  EditableEntrySection,
  EntryResponse,
  PartyResponse,
  PeriodSummaryResponse,
} from '@finances/shared';
import { createEntry, deleteEntry } from '@/lib/entries-api';
import { SECTION_META, SHEET_LEFT, SHEET_RIGHT } from '@/lib/entry-labels';
import { formatBrl, parseBrlInput } from '@/lib/money';

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
  const allSections = [...SHEET_LEFT, ...SHEET_RIGHT];
  const [drafts, setDrafts] = useState<Record<EditableEntrySection, Draft>>(() =>
    Object.fromEntries(allSections.map((s) => [s, emptyDraft()])) as Record<
      EditableEntrySection,
      Draft
    >,
  );
  const [rowError, setRowError] = useState<string | null>(null);
  const [busySection, setBusySection] = useState<EditableEntrySection | null>(null);

  function entriesFor(section: EditableEntrySection): EntryResponse[] {
    return entries.filter((e) => e.section === section);
  }

  function blockTotal(section: EditableEntrySection): number {
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
  const balanceClass = summary.monthBalance < 0 ? 'text-danger' : 'text-accent';

  const shared = {
    drafts,
    busySection,
    parties,
    cardAccounts,
    updateDraft,
    onAdd,
    onDelete,
    entriesFor,
    blockTotal,
    summary,
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sheet">
      {rowError && (
        <p className="border-b border-line bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {rowError}
        </p>
      )}

      {/* Linha 1 — A pagar + Caixa | A receber */}
      <div className="grid border-b border-line lg:grid-cols-2">
        <div className="grid border-b border-line lg:border-b-0 lg:border-r lg:grid-cols-[1fr_7.5rem]">
          <SheetBlock section="PAYABLE" {...shared} />
          <CaixaPanel
            caixaInput={caixaInput}
            notes={notes}
            saving={savingCaixa}
            onCaixaChange={onCaixaChange}
            onNotesChange={onNotesChange}
            onSave={onSaveCaixa}
          />
        </div>
        <SheetBlock section="RECEIVABLE" {...shared} />
      </div>

      {/* Faixa totais (como na planilha) */}
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line">
        <div className="bg-surface px-4 py-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Total a pagar</p>
          <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-danger">
            {formatBrl(summary.totalPayables)}
          </p>
        </div>
        <div className="bg-surface px-4 py-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Total a receber
          </p>
          <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-accent">
            {formatBrl(summary.totalReceivables)}
          </p>
        </div>
      </div>

      {/* Linha 2 — Cartões | Saídas */}
      <div className="grid border-b border-line lg:grid-cols-2">
        <div className="border-b border-line lg:border-b-0 lg:border-r">
          <SheetBlock section="CARD_ITEM" {...shared} />
        </div>
        <SheetBlock section="CASH_OUT" {...shared} />
      </div>

      {/* Linha 3 — Fixos | Outras entradas */}
      <div className="grid border-b border-line lg:grid-cols-2">
        <div className="border-b border-line lg:border-b-0 lg:border-r">
          <SheetBlock section="CARD_FIXED" {...shared} />
        </div>
        <SheetBlock section="OTHER_INCOME" {...shared} />
      </div>

      {/* Rodapé — saldos */}
      <div className="grid gap-px bg-line sm:grid-cols-3">
        <FooterCell label="Obrigações líquidas" value={summary.netObligations} />
        <FooterCell label="Saldo do mês" value={summary.monthBalance} className={balanceClass} strong />
        <FooterCell label="Saldo detalhe" value={summary.detailBalance} />
      </div>
    </div>
  );
}

function CaixaPanel({
  caixaInput,
  notes,
  saving,
  onCaixaChange,
  onNotesChange,
  onSave,
}: {
  caixaInput: string;
  notes: string;
  saving: boolean;
  onCaixaChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSave: (e: FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSave}
      className="flex flex-col border-t border-line bg-surface-2 lg:border-l lg:border-t-0"
    >
      <div className="border-b border-line px-2 py-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Caixa</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-muted">
          Valor
          <input
            className="sheet-input rounded border border-line text-center font-mono text-base font-semibold tabular-nums"
            value={caixaInput}
            onChange={(e) => onCaixaChange(e.target.value)}
            inputMode="decimal"
            required
            aria-label="Caixa do mês"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-muted">
          Notas
          <textarea
            className="sheet-input min-h-[64px] flex-1 resize-none rounded border border-line"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            maxLength={2000}
            placeholder="—"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-accent px-2 py-1.5 text-xs font-semibold text-on-accent disabled:opacity-60"
        >
          {saving ? '…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

type BlockShared = {
  drafts: Record<EditableEntrySection, Draft>;
  busySection: EditableEntrySection | null;
  parties: PartyResponse[];
  cardAccounts: AccountResponse[];
  updateDraft: (section: EditableEntrySection, patch: Partial<Draft>) => void;
  onAdd: (section: EditableEntrySection, event: FormEvent) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  entriesFor: (section: EditableEntrySection) => EntryResponse[];
  blockTotal: (section: EditableEntrySection) => number;
  summary: PeriodSummaryResponse;
};

function SheetBlock({
  section,
  drafts,
  busySection,
  parties,
  cardAccounts,
  updateDraft,
  onAdd,
  onDelete,
  entriesFor,
  blockTotal,
  summary,
}: BlockShared & { section: EditableEntrySection }) {
  const meta = SECTION_META[section];
  const items = entriesFor(section);
  const isCard = section === 'CARD_ITEM' || section === 'CARD_FIXED';
  const draft = drafts[section];
  const col3Label =
    section === 'RECEIVABLE' ? 'Parte' : isCard ? 'Parc.' : section === 'PAYABLE' ? 'Venc.' : 'Obs.';

  return (
    <section className="flex min-h-0 flex-col bg-surface">
      <header className="border-b border-line bg-surface-2 px-2 py-2 text-center">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">{meta.title}</h2>
      </header>

      <div
        className="min-h-0 flex-1 overflow-x-auto"
        role="region"
        aria-label={`Tabela ${meta.title}`}
        tabIndex={0}
      >
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{meta.title}</caption>
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
              <th scope="col" className="px-2 py-1 text-left font-medium">
                Descrição
              </th>
              <th scope="col" className="w-20 px-1 py-1 text-left font-medium">
                {col3Label}
              </th>
              <th scope="col" className="w-24 px-2 py-1 text-right font-medium">
                Valor
              </th>
              <th scope="col" className="w-8 px-1 py-1">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const partyName =
                item.partyId != null
                  ? parties.find((p) => p.id === item.partyId)?.name
                  : null;
              const parcel =
                item.installmentCurrent != null && item.installmentTotal != null
                  ? `${item.installmentCurrent}/${item.installmentTotal}`
                  : null;
              let mid: ReactNode = '—';
              if (section === 'PAYABLE') mid = item.dueLabel || '—';
              else if (section === 'RECEIVABLE') mid = partyName || '—';
              else if (isCard) mid = parcel || item.dueLabel || '—';
              else mid = item.dueLabel || '—';

              return (
                <tr
                  key={item.id}
                  className={[
                    'border-b border-line',
                    index % 2 === 1 ? 'bg-surface-2/40' : '',
                    'hover:bg-accent-dim/30',
                  ].join(' ')}
                >
                  <th scope="row" className="px-2 py-1 text-left font-normal text-ink">
                    {item.description}
                  </th>
                  <td className="px-1 py-1 text-muted">{mid}</td>
                  <td className="px-2 py-1 text-right font-mono tabular-nums text-ink">
                    {formatBrl(item.amount)}
                  </td>
                  <td className="px-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="text-xs text-muted hover:text-danger"
                      aria-label={`Excluir ${item.description}`}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}

            {section === 'PAYABLE' && (
              <tr className="border-b border-line bg-surface-2/60">
                <th scope="row" className="px-2 py-1 text-left font-normal text-muted">
                  Cartões
                </th>
                <td className="px-1 py-1 text-muted">derivado</td>
                <td className="px-2 py-1 text-right font-mono tabular-nums text-ink">
                  {formatBrl(summary.totalCard)}
                </td>
                <td />
              </tr>
            )}

            {items.length === 0 && section !== 'PAYABLE' && (
              <tr className="border-b border-line">
                <td colSpan={4} className="px-2 py-2 text-xs text-muted">
                  Vazio — preencha a linha abaixo.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-surface-2">
              <th scope="row" colSpan={2} className="px-2 py-1.5 text-left text-xs font-semibold text-ink">
                Total
              </th>
              <td className="px-2 py-1.5 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                {formatBrl(blockTotal(section))}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <form
        onSubmit={(e) => onAdd(section, e)}
        className="grid grid-cols-[1fr_5rem_5.5rem_2rem] border-t border-line bg-paper/50"
      >
        <input
          className="sheet-input border-r border-line"
          placeholder="Novo…"
          value={draft.description}
          onChange={(e) => updateDraft(section, { description: e.target.value })}
          maxLength={255}
          aria-label={`Nova descrição em ${meta.title}`}
        />
        {section === 'RECEIVABLE' ? (
          <select
            className="sheet-input border-r border-line"
            value={draft.partyId}
            onChange={(e) => updateDraft(section, { partyId: e.target.value })}
            aria-label="Parte"
          >
            <option value="">—</option>
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
              className="sheet-input w-1/2 border-r border-line text-center"
              placeholder="n"
              value={draft.installmentCurrent}
              onChange={(e) => updateDraft(section, { installmentCurrent: e.target.value })}
              inputMode="numeric"
              aria-label="Parcela atual"
            />
            <input
              className="sheet-input w-1/2 text-center"
              placeholder="m"
              value={draft.installmentTotal}
              onChange={(e) => updateDraft(section, { installmentTotal: e.target.value })}
              inputMode="numeric"
              aria-label="Total de parcelas"
            />
          </div>
        ) : (
          <input
            className="sheet-input border-r border-line"
            placeholder={section === 'PAYABLE' ? 'dia' : '—'}
            value={draft.dueLabel}
            onChange={(e) => updateDraft(section, { dueLabel: e.target.value })}
            maxLength={80}
            aria-label="Vencimento ou observação"
          />
        )}
        <input
          className="sheet-input border-r border-line text-right font-mono tabular-nums"
          placeholder="0,00"
          value={draft.amount}
          onChange={(e) => updateDraft(section, { amount: e.target.value })}
          inputMode="decimal"
          aria-label="Valor"
        />
        <button
          type="submit"
          disabled={busySection === section}
          className="text-sm font-semibold text-accent hover:bg-accent-dim disabled:opacity-50"
          aria-label={`Adicionar em ${meta.title}`}
        >
          +
        </button>
      </form>

      {isCard && cardAccounts.length > 1 && (
        <div className="border-t border-line px-2 py-1">
          <select
            className="sheet-input text-xs"
            value={draft.accountId}
            onChange={(e) => updateDraft(section, { accountId: e.target.value })}
            aria-label="Conta cartão"
          >
            <option value="">Conta: Cartões (padrão)</option>
            {cardAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}

function FooterCell({
  label,
  value,
  className = '',
  strong,
}: {
  label: string;
  value: number;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className="bg-surface px-3 py-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={[
          'mt-0.5 font-mono tabular-nums',
          strong ? 'text-base font-semibold' : 'text-sm text-ink',
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
