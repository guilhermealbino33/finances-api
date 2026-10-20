/** Shared contracts — grow as features land. */
export const APP_NAME = 'finances';

export type HealthStatus = 'ok' | 'degraded' | 'down';

export type HealthResponse = {
  status: HealthStatus;
  service: string;
  version: string;
  timestamp: string;
};

export type UserStatus = 'ATIVO' | 'INATIVO';
export const USER_STATUSES: UserStatus[] = ['ATIVO', 'INATIVO'];

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

/** Período mensal (#5) — espelha uma aba da planilha. */
export interface PeriodResponse {
  id: number;
  year: number;
  month: number;
  caixaBudget: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePeriodRequest {
  year: number;
  month: number;
  caixaBudget: number;
  notes?: string | null;
}

export interface UpdatePeriodRequest {
  caixaBudget?: number;
  notes?: string | null;
}

/**
 * Totais do mês. Fórmulas: docs/DOMAIN.md
 * totalCard (#8) entra em totalPayables.
 */
export interface PeriodSummaryResponse {
  period: PeriodResponse;
  totalPayables: number;
  totalReceivables: number;
  totalCard: number;
  totalCashOut: number;
  totalOtherIncome: number;
  /** totalPayables - totalReceivables */
  netObligations: number;
  monthBalance: number;
  detailBalance: number;
}

/** Sections de Entry — varchar na API / DB. */
export type EntrySection =
  | 'PAYABLE'
  | 'RECEIVABLE'
  | 'CARD_ITEM'
  | 'CARD_FIXED'
  | 'CASH_OUT'
  | 'OTHER_INCOME';

export const ENTRY_SECTIONS: EntrySection[] = [
  'PAYABLE',
  'RECEIVABLE',
  'CARD_ITEM',
  'CARD_FIXED',
  'CASH_OUT',
  'OTHER_INCOME',
];

/** Blocos manuais #7 (sem cartão). */
export type MvpEntrySection = 'PAYABLE' | 'RECEIVABLE' | 'CASH_OUT' | 'OTHER_INCOME';
export const MVP_ENTRY_SECTIONS: MvpEntrySection[] = [
  'PAYABLE',
  'RECEIVABLE',
  'CASH_OUT',
  'OTHER_INCOME',
];

/** Sections criáveis via API (#7 + #8). */
export type EditableEntrySection = MvpEntrySection | 'CARD_ITEM' | 'CARD_FIXED';
export const EDITABLE_ENTRY_SECTIONS: EditableEntrySection[] = [
  'PAYABLE',
  'RECEIVABLE',
  'CARD_ITEM',
  'CARD_FIXED',
  'CASH_OUT',
  'OTHER_INCOME',
];

export type EntrySectionSums = Record<EntrySection, number>;

export function emptyEntrySectionSums(): EntrySectionSums {
  return {
    PAYABLE: 0,
    RECEIVABLE: 0,
    CARD_ITEM: 0,
    CARD_FIXED: 0,
    CASH_OUT: 0,
    OTHER_INCOME: 0,
  };
}

/** Regra planilha: Cartões = CARD_ITEM + CARD_FIXED; A pagar inclui Cartões. */
export function computePeriodTotals(
  caixaBudget: number,
  sums: EntrySectionSums,
): Omit<PeriodSummaryResponse, 'period'> {
  const totalCard = roundMoney(sums.CARD_ITEM + sums.CARD_FIXED);
  const totalPayables = roundMoney(sums.PAYABLE + totalCard);
  const totalReceivables = roundMoney(sums.RECEIVABLE);
  const totalCashOut = roundMoney(sums.CASH_OUT);
  const totalOtherIncome = roundMoney(sums.OTHER_INCOME);
  const netObligations = roundMoney(totalPayables - totalReceivables);
  const monthBalance = roundMoney(caixaBudget - totalPayables + totalReceivables);
  const detailBalance = roundMoney(monthBalance - totalCashOut + totalOtherIncome);

  return {
    totalPayables,
    totalReceivables,
    totalCard,
    totalCashOut,
    totalOtherIncome,
    netObligations,
    monthBalance,
    detailBalance,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface EntryResponse {
  id: number;
  periodId: number;
  section: EntrySection;
  description: string;
  amount: number;
  dueLabel: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  accountId: number | null;
  partyId: number | null;
  seriesId: number | null;
  notes: string | null;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryRequest {
  periodId: number;
  section: EditableEntrySection;
  description: string;
  amount: number;
  dueLabel?: string | null;
  installmentCurrent?: number | null;
  installmentTotal?: number | null;
  accountId?: number | null;
  partyId?: number | null;
  notes?: string | null;
  sortOrder?: number | null;
}

export interface UpdateEntryRequest {
  description?: string;
  amount?: number;
  dueLabel?: string | null;
  installmentCurrent?: number | null;
  installmentTotal?: number | null;
  accountId?: number | null;
  partyId?: number | null;
  notes?: string | null;
  sortOrder?: number | null;
}

/** Conta financeira (#6) — classifica lançamentos. */
export type AccountType = 'CARD' | 'CASH' | 'BANK' | 'OTHER';
export const ACCOUNT_TYPES: AccountType[] = ['CARD', 'CASH', 'BANK', 'OTHER'];

export interface AccountResponse {
  id: number;
  name: string;
  type: AccountType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  active?: boolean;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: AccountType;
  active?: boolean;
}

/** Pessoa envolvida em A receber (#6). */
export interface PartyResponse {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartyRequest {
  name: string;
  active?: boolean;
}

export interface UpdatePartyRequest {
  name?: string;
  active?: boolean;
}
