import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { PartyResponse } from '@finances/shared';
import { useAuth } from '@/contexts/AuthContext';
import { createParty, listParties, updateParty } from '@/lib/parties-api';
import { paths } from '@/paths';

export function PartiesPage() {
  const { logout } = useAuth();
  const [items, setItems] = useState<PartyResponse[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const rows = await listParties();
    setItems(rows);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listParties()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar partes');
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
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Informe o nome');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createParty({ name: trimmed });
      setName('');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar parte');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: PartyResponse) {
    setError(null);
    try {
      await updateParty(item.id, { active: !item.active });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Finances</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            Partes
          </h1>
          <p className="mt-1 text-sm text-muted">Pessoas de A receber (Gui, Udo, Vivi…).</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link to={paths.home} className="text-sm text-muted hover:text-accent">
            Início
          </Link>
          <button type="button" onClick={logout} className="text-sm text-muted hover:text-accent">
            Sair
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={onCreate}
        className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Nova parte</h2>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nome
          <input
            className="rounded-lg border border-line px-3 py-2 font-normal outline-none focus:border-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Salvando…' : 'Criar parte'}
        </button>
      </form>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Lista</h2>
        {loading && <p className="mt-3 text-sm text-muted">Carregando…</p>}
        {!loading && items.length === 0 && (
          <p className="mt-3 text-sm text-muted">Nenhuma parte ainda.</p>
        )}
        <ul className="mt-3 divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <p className={item.active ? 'font-medium text-ink' : 'text-muted line-through'}>
                {item.name}
              </p>
              <button
                type="button"
                onClick={() => toggleActive(item)}
                className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-xs hover:border-accent"
              >
                {item.active ? 'Desativar' : 'Ativar'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
