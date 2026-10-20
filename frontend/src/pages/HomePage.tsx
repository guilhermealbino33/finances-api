import { useEffect, useState } from 'react';
import { APP_NAME, type HealthResponse } from '@finances/shared';
import { useAuth } from '@/contexts/AuthContext';
import { fetchHealth } from '@/lib/health-api';

export function HomePage() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao consultar a API');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Finances</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
            Olá, {user?.name.split(' ')[0] ?? 'você'}
          </h1>
          <p className="mt-3 text-muted">
            Sessão autenticada (<code className="text-ink">{APP_NAME}</code>). Domínio da planilha
            nas próximas issues.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-accent"
        >
          Sair
        </button>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Conta</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">e-mail</dt>
          <dd>{user?.email}</dd>
          <dt className="text-muted">status</dt>
          <dd>{user?.status}</dd>
        </dl>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">API health</h2>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        {!error && !health && <p className="mt-3 text-sm text-muted">Consultando…</p>}
        {health && (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">status</dt>
            <dd className="font-medium text-accent">{health.status}</dd>
            <dt className="text-muted">service</dt>
            <dd>{health.service}</dd>
            <dt className="text-muted">version</dt>
            <dd>{health.version}</dd>
          </dl>
        )}
      </section>

      <p className="text-xs text-muted">web v{__APP_VERSION__}</p>
    </main>
  );
}
