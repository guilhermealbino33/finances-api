import type { EditableEntrySection } from '@finances/shared';

export const SECTION_META: Record<
  EditableEntrySection,
  { title: string; hint: string }
> = {
  PAYABLE: {
    title: 'A pagar',
    hint: 'Linha Cartões é soma automática.',
  },
  RECEIVABLE: {
    title: 'A receber',
    hint: 'Quem deve / o quê.',
  },
  CARD_ITEM: {
    title: 'Cartões',
    hint: 'Fatura (ex-Nubank).',
  },
  CARD_FIXED: {
    title: 'Fixos (cartão)',
    hint: 'Fixos cobrados no cartão.',
  },
  CASH_OUT: {
    title: 'Saídas (dinheiro)',
    hint: 'Saídas em espécie.',
  },
  OTHER_INCOME: {
    title: 'Outras entradas',
    hint: 'Benefícios e extras.',
  },
};

/** Layout planilha: esquerda / direita (2×3). */
export const SHEET_LEFT: EditableEntrySection[] = ['PAYABLE', 'CARD_ITEM', 'CARD_FIXED'];
export const SHEET_RIGHT: EditableEntrySection[] = ['RECEIVABLE', 'CASH_OUT', 'OTHER_INCOME'];
