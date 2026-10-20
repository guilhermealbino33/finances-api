import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { paths } from '@/paths';

function currentPeriodPath(): string {
  const now = new Date();
  return paths.period(now.getFullYear(), now.getMonth() + 1);
}

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Finances</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
            Olá, {user?.name.split(' ')[0] ?? 'você'}
          </h1>
          <p className="mt-3 text-muted">
            Organize o mês como na planilha — comece pelo período e o valor de Caixa.
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

      <Link
        to={currentPeriodPath()}
        className="rounded-2xl bg-accent px-5 py-4 text-center text-sm font-semibold text-white shadow-sm"
      >
        Abrir mês atual
      </Link>

      <p className="text-xs text-muted">web v{__APP_VERSION__}</p>
    </main>
  );
}
