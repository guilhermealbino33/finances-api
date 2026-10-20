import type {
  CreateEntryRequest,
  EntryResponse,
  EntrySection,
  UpdateEntryRequest,
} from '@finances/shared';
import { apiRequest } from '@/lib/api';

export function listEntries(periodId: number, section?: EntrySection): Promise<EntryResponse[]> {
  const q = section ? `?section=${section}` : '';
  return apiRequest<EntryResponse[]>(`/periods/${periodId}/entries${q}`);
}

export function createEntry(body: CreateEntryRequest): Promise<EntryResponse> {
  return apiRequest<EntryResponse>('/entries', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateEntry(id: number, body: UpdateEntryRequest): Promise<EntryResponse> {
  return apiRequest<EntryResponse>(`/entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteEntry(id: number): Promise<void> {
  return apiRequest<void>(`/entries/${id}`, { method: 'DELETE' });
}
