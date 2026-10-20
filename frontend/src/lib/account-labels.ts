import type { AccountType } from '@finances/shared';

const LABELS: Record<AccountType, string> = {
  CARD: 'Cartão',
  CASH: 'Dinheiro',
  BANK: 'Banco',
  OTHER: 'Outro',
};

export function accountTypeLabel(type: AccountType): string {
  return LABELS[type] ?? type;
}
