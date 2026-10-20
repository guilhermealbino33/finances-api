import type {
  CreatePeriodRequest,
  PeriodResponse,
  PeriodSummaryResponse,
  UpdatePeriodRequest,
} from '@finances/shared';
import { apiRequest } from '@/lib/api';
import { materializeSeries } from '@/lib/recurring-api';

export function listPeriods(year?: number): Promise<PeriodResponse[]> {
  const q = year != null ? `?year=${year}` : '';
  return apiRequest<PeriodResponse[]>(`/periods${q}`);
}

export function getPeriod(year: number, month: number): Promise<PeriodResponse> {
  return apiRequest<PeriodResponse>(`/periods/${year}/${month}`);
}

export function createPeriod(body: CreatePeriodRequest): Promise<PeriodResponse> {
  return apiRequest<PeriodResponse>('/periods', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updatePeriod(id: number, body: UpdatePeriodRequest): Promise<PeriodResponse> {
  return apiRequest<PeriodResponse>(`/periods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function getPeriodSummary(id: number): Promise<PeriodSummaryResponse> {
  return apiRequest<PeriodSummaryResponse>(`/periods/${id}/summary`);
}

/** Busca o mês ou cria com Caixa padrão; ao criar, materializa séries ativas (#9). */
export async function ensurePeriod(
  year: number,
  month: number,
  defaultCaixa = 8000,
): Promise<PeriodResponse> {
  try {
    return await getPeriod(year, month);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (!/não encontrado|404/i.test(msg)) throw err;
    const period = await createPeriod({ year, month, caixaBudget: defaultCaixa });
    try {
      await materializeSeries(period.id);
    } catch {
      /* materialize é best-effort na criação */
    }
    return period;
  }
}
