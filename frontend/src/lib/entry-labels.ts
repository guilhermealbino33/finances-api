import type { MvpEntrySection } from '@finances/shared';

export const MVP_SECTION_META: Record<
  MvpEntrySection,
  { title: string; hint: string; totalKey: 'totalPayables' | 'totalReceivables' | 'totalCashOut' | 'totalOtherIncome' }
> = {
  PAYABLE: {
    title: 'A pagar',
    hint: 'Exceto linha Cartões (derivada na #8).',
    totalKey: 'totalPayables',
  },
  RECEIVABLE: {
    title: 'A receber',
    hint: 'Opcional: vincular uma parte (Gui, Udo…).',
    totalKey: 'totalReceivables',
  },
  CASH_OUT: {
    title: 'Saídas',
    hint: 'Saídas em dinheiro.',
    totalKey: 'totalCashOut',
  },
  OTHER_INCOME: {
    title: 'Outras entradas',
    hint: 'Benefícios e entradas extras.',
    totalKey: 'totalOtherIncome',
  },
};
