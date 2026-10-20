import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'light' ? 'escuro' : 'claro';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="text-sm text-muted hover:text-accent"
      title={`Mudar para tema ${next}`}
      aria-label={`Tema atual: ${theme === 'light' ? 'claro' : 'escuro'}. Alternar para ${next}.`}
    >
      {theme === 'light' ? 'Escuro' : 'Claro'}
    </button>
  );
}
