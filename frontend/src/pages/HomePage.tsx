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
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Finances</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
            Olá, {user?.name.split(' ')[0] ?? 'você'}
          </h1>
          <p className="mt-3 text-muted">
            Abra o mês na planilha — Caixa, a pagar, cartões e saldos num único quadro.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="shrink-0 rounded border border-line px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-accent"
        >
          Sair
        </button>
      </div>

      <section className="rounded-xl border border-line bg-surface px-5 py-4 shadow-sheet">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Conta</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">e-mail</dt>
          <dd>{user?.email}</dd>
          <dt className="text-muted">status</dt>
          <dd>{user?.status}</dd>
        </dl>
      </section>

      <Link
        to={currentPeriodPath()}
        className="rounded-xl bg-accent px-5 py-4 text-center text-sm font-semibold text-paper shadow-sheet"
      >
        Abrir mês atual
      </Link>

      <nav className="grid grid-cols-2 gap-3">
        <Link
          to={paths.accounts}
          className="rounded-xl border border-line bg-surface px-4 py-3 text-center text-sm font-medium text-ink hover:border-accent"
        >
          Contas
        </Link>
        <Link
          to={paths.parties}
          className="rounded-xl border border-line bg-surface px-4 py-3 text-center text-sm font-medium text-ink hover:border-accent"
        >
          Partes
        </Link>
      </nav>

      <p className="text-xs text-muted">web v{__APP_VERSION__}</p>
    </main>
  );
}
