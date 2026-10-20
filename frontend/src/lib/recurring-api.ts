import type {
  CreateRecurringSeriesRequest,
  MaterializeSeriesResponse,
  RecurringSeriesResponse,
  RecurringSeriesStatus,
  UpdateRecurringSeriesRequest,
} from '@finances/shared';
import { apiRequest } from '@/lib/api';

export function listRecurringSeries(
  status?: RecurringSeriesStatus,
): Promise<RecurringSeriesResponse[]> {
  const q = status ? `?status=${status}` : '';
  return apiRequest<RecurringSeriesResponse[]>(`/recurring-series${q}`);
}

export function createRecurringSeries(
  body: CreateRecurringSeriesRequest,
): Promise<RecurringSeriesResponse> {
  return apiRequest<RecurringSeriesResponse>('/recurring-series', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateRecurringSeries(
  id: number,
  body: UpdateRecurringSeriesRequest,
): Promise<RecurringSeriesResponse> {
  return apiRequest<RecurringSeriesResponse>(`/recurring-series/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function materializeSeries(periodId: number): Promise<MaterializeSeriesResponse> {
  return apiRequest<MaterializeSeriesResponse>(`/periods/${periodId}/materialize-series`, {
    method: 'POST',
  });
}
