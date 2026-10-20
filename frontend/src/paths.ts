/** Rotas do app. */
export const paths = {
  home: '/',
  login: '/login',
  period: (year: number, month: number) => `/meses/${year}/${month}`,
} as const;
