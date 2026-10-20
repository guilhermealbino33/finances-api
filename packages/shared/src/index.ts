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
