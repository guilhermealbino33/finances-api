import { useState, type FormEvent } from 'react';
import type { EntryResponse, MvpEntrySection, PartyResponse } from '@finances/shared';
import { formatBrl, parseBrlInput } from '@/lib/money';
import { createEntry, deleteEntry } from '@/lib/entries-api';
import { MVP_SECTION_META } from '@/lib/entry-labels';

type Props = {
  periodId: number;
  section: MvpEntrySection;
  items: EntryResponse[];
  parties: PartyResponse[];
  sectionTotal: number;
  onChanged: () => Promise<void>;
};

export function EntrySectionBlock({
  periodId,
  section,
  items,
  parties,
  sectionTotal,
  onChanged,
}: Props) {
  const meta = MVP_SECTION_META[section];
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [dueLabel, setDueLabel] = useState('');
  const [partyId, setPartyId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const amount = parseBrlInput(amountInput);
    if (amount == null || amount <= 0) {
      setError('Informe um valor maior que zero');
      return;
    }
    const trimmed = description.trim();
    if (!trimmed) {
      setError('Informe a descrição');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createEntry({
        periodId,
        section,
        description: trimmed,
        amount,
        dueLabel: dueLabel.trim() || null,
        partyId:
          section === 'RECEIVABLE' && partyId ? Number(partyId) : null,
      });
      setDescription('');
      setAmountInput('');
      setDueLabel('');
      setPartyId('');
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    setError(null);
    try {
      await deleteEntry(id);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir');
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {meta.title}
          </h2>
          <p className="mt-0.5 text-xs text-muted">{meta.hint}</p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-ink">{formatBrl(sectionTotal)}</p>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <ul className="mt-3 divide-y divide-line">
        {items.length === 0 && (
          <li className="py-2 text-sm text-muted">Nenhum lançamento.</li>
        )}
        {items.map((item) => {
          const partyName =
            item.partyId != null
              ? parties.find((p) => p.id === item.partyId)?.name
              : null;
          return (
            <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-ink">{item.description}</p>
                <p className="text-xs text-muted">
                  {item.dueLabel ? `${item.dueLabel} · ` : ''}
                  {partyName ? `${partyName} · ` : ''}
                  {formatBrl(item.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="shrink-0 rounded-lg border border-line px-2 py-1 text-xs text-muted hover:border-red-400 hover:text-red-700"
              >
                Excluir
              </button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={onCreate} className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
        <label className="flex flex-col gap-1 text-xs font-medium">
          Descrição
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm font-normal outline-none focus:border-accent"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={255}
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium">
            Valor (R$)
            <input
              className="rounded-lg border border-line px-3 py-2 text-sm font-normal tabular-nums outline-none focus:border-accent"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              inputMode="decimal"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Vencimento
            <input
              className="rounded-lg border border-line px-3 py-2 text-sm font-normal outline-none focus:border-accent"
              value={dueLabel}
              onChange={(e) => setDueLabel(e.target.value)}
              placeholder="dia 07"
              maxLength={80}
            />
          </label>
        </div>
        {section === 'RECEIVABLE' && (
          <label className="flex flex-col gap-1 text-xs font-medium">
            Parte
            <select
              className="rounded-lg border border-line px-3 py-2 text-sm font-normal outline-none focus:border-accent"
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
            >
              <option value="">— opcional —</option>
              {parties
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Salvando…' : 'Adicionar'}
        </button>
      </form>
    </section>
  );
}
