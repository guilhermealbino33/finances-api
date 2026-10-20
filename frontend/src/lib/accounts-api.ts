import type {
  AccountResponse,
  CreateAccountRequest,
  UpdateAccountRequest,
} from '@finances/shared';
import { apiRequest } from '@/lib/api';

export function listAccounts(active?: boolean): Promise<AccountResponse[]> {
  const q = active === undefined ? '' : `?active=${active}`;
  return apiRequest<AccountResponse[]>(`/accounts${q}`);
}

export function createAccount(body: CreateAccountRequest): Promise<AccountResponse> {
  return apiRequest<AccountResponse>('/accounts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateAccount(id: number, body: UpdateAccountRequest): Promise<AccountResponse> {
  return apiRequest<AccountResponse>(`/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
