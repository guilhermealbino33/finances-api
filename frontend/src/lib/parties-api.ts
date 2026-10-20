import type {
  CreatePartyRequest,
  PartyResponse,
  UpdatePartyRequest,
} from '@finances/shared';
import { apiRequest } from '@/lib/api';

export function listParties(active?: boolean): Promise<PartyResponse[]> {
  const q = active === undefined ? '' : `?active=${active}`;
  return apiRequest<PartyResponse[]>(`/parties${q}`);
}

export function createParty(body: CreatePartyRequest): Promise<PartyResponse> {
  return apiRequest<PartyResponse>('/parties', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateParty(id: number, body: UpdatePartyRequest): Promise<PartyResponse> {
  return apiRequest<PartyResponse>(`/parties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
