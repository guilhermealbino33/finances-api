import type { EditableEntrySection } from '@finances/shared';

export const SECTION_META: Record<
  EditableEntrySection,
  { title: string; hint: string }
> = {
  PAYABLE: {
    title: 'A pagar',
    hint: 'Obrigações do mês. Linha Cartões é calculada (não editável).',
  },
  RECEIVABLE: {
    title: 'A receber',
    hint: 'Opcional: vincular uma parte (Gui, Udo…).',
  },
  CARD_ITEM: {
    title: 'Cartões',
    hint: 'Itens da fatura (compras, Geral, parcelas).',
  },
  CARD_FIXED: {
    title: 'Fixos (cartão)',
    hint: 'Assinaturas e fixos cobrados no cartão.',
  },
  CASH_OUT: {
    title: 'Saídas',
    hint: 'Saídas em dinheiro.',
  },
  OTHER_INCOME: {
    title: 'Outras entradas',
    hint: 'Benefícios e entradas extras.',
  },
};

/** Ordem visual do dashboard (mapa mental da planilha). */
export const DASHBOARD_SECTIONS: EditableEntrySection[] = [
  'PAYABLE',
  'RECEIVABLE',
  'CARD_ITEM',
  'CARD_FIXED',
  'CASH_OUT',
  'OTHER_INCOME',
];
