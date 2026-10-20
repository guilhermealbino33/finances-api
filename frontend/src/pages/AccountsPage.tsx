import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ACCOUNT_TYPES, type AccountResponse, type AccountType } from '@finances/shared';
import { useAuth } from '@/contexts/AuthContext';
import { accountTypeLabel } from '@/lib/account-labels';
import { createAccount, listAccounts, updateAccount } from '@/lib/accounts-api';
import { paths } from '@/paths';

export function AccountsPage() {
  const { logout } = useAuth();
  const [items, setItems] = useState<AccountResponse[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CARD');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const rows = await listAccounts();
    setItems(rows);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAccounts()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar contas');
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
      setError('Informe o nome da conta');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createAccount({ name: trimmed, type });
      setName('');
      setType('CARD');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar conta');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: AccountResponse) {
    setError(null);
    try {
      await updateAccount(item.id, { active: !item.active });
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
            Contas
          </h1>
          <p className="mt-1 text-sm text-muted">Classificam lançamentos (Cartões, C6, BB…).</p>
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Nova conta</h2>
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
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tipo
          <select
            className="rounded-lg border border-line px-3 py-2 font-normal outline-none focus:border-accent"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {accountTypeLabel(t)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Salvando…' : 'Criar conta'}
        </button>
      </form>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Lista</h2>
        {loading && <p className="mt-3 text-sm text-muted">Carregando…</p>}
        {!loading && items.length === 0 && (
          <p className="mt-3 text-sm text-muted">Nenhuma conta ainda.</p>
        )}
        <ul className="mt-3 divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className={item.active ? 'font-medium text-ink' : 'text-muted line-through'}>
                  {item.name}
                </p>
                <p className="text-xs text-muted">{accountTypeLabel(item.type)}</p>
              </div>
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
