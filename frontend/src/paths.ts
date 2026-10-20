/** Rotas do app. */
export const paths = {
  home: '/',
  login: '/login',
  accounts: '/contas',
  parties: '/partes',
  period: (year: number, month: number) => `/meses/${year}/${month}`,
} as const;
