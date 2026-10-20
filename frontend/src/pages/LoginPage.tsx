import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { paths } from '@/paths';

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== paths.login
      ? (location.state as { from: string }).from
      : paths.home;

  const [email, setEmail] = useState('guilhermealbino33@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao entrar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Finances</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">Entrar</h1>
          <p className="mt-3 text-muted">Acesse com o usuário seed do ambiente local.</p>
        </div>
        <ThemeToggle />
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-sheet"
      >
        {error && (
          <p className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          E-mail
          <input
            className="rounded border border-line bg-paper px-3 py-2 font-normal outline-none focus:border-accent"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Senha
          <input
            className="rounded border border-line bg-paper px-3 py-2 font-normal outline-none focus:border-accent"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent disabled:opacity-60"
        >
          {saving ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
