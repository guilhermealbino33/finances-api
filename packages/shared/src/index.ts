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
 * Totais do mês. Até existirem lançamentos (#7+), campos de entries ficam zerados.
 * Fórmulas: ver docs/DOMAIN.md
 */
export interface PeriodSummaryResponse {
  period: PeriodResponse;
  totalPayables: number;
  totalReceivables: number;
  totalCard: number;
  totalCashOut: number;
  totalOtherIncome: number;
  monthBalance: number;
  detailBalance: number;
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
