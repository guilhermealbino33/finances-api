/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#070d1a',
        surface: '#0f1a2e',
        'surface-2': '#15233d',
        ink: '#e7eefc',
        muted: '#8b9bb8',
        line: '#243552',
        accent: '#39ff14',
        'accent-dim': '#1a3d24',
        danger: '#ff5c7a',
        warn: '#ffc14a',
      },
      fontFamily: {
        sans: ['"Sora"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        sheet: '0 0 0 1px #243552, 0 24px 48px -24px rgba(0, 0, 0, 0.65)',
      },
    },
  },
  plugins: [],
};
